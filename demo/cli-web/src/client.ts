import ReactDOM from "react-dom";
import { InterceptBus } from "@interceptor/lib";
import {
  DispatchSubmitHandler,
  HookSetup,
  OnHookRemove,
  RenderState,
} from "./types";
import render from "./render";

function unmount(domId: string) {
  const elementById = document.getElementById(domId);

  if (elementById === null) {
    throw new Error(`Can't find interceptor root element with #${domId}`);
  } else {
    ReactDOM.unmountComponentAtNode(elementById);
  }
}

export function mountInterceptorClient(
  domId: string,
  eventBus: InterceptBus
): void {
  const onHookAdd = (hookSetup: HookSetup) => {
    // Prepend so latest hook will be applied first if it matches the mask
    state.hooks.unshift({
      uuidMask: hookSetup.uuidMask,
      hitCount: 0,
      hookConfiguration: { hook: hookSetup.action, delayMs: hookSetup.delayMs },
    });

    render(state);
  };

  const onHookRemove: OnHookRemove = (removeIndex, skipRender = false) => {
    // Default submit will set hook as "suspend", i.e. no change
    if (removeIndex >= 0) {
      state.hooks.splice(removeIndex, 1);
    }

    if (!skipRender) {
      render(state);
    }
  };

  const onDispatchSubmit: DispatchSubmitHandler = (eventToRemove, event) => {
    state.queue.splice(eventToRemove, 1);

    eventBus.dispatch(event);

    unmount(domId);

    if (state.queue.length > 0) {
      render(state);
    }
  };
  const state: RenderState = {
    domId,
    visible: true,
    queue: [],
    hooks: [
      {
        hookConfiguration: { delayMs: 0, hook: "suspend" },
        uuidMask: /.*/,
        hitCount: 0,
      },
    ],
    onDispatchSubmit,
    onHookAdd,
    onHookRemove,
    onToggleVisible,
  };

  function onToggleVisible(isVisible: boolean) {
    state.visible = isVisible;
    render(state);
  }

  document.addEventListener(
    "keyup",
    (event) => {
      if (event.code === "Backquote") {
        state.visible = !state.visible;
      }

      if (state.visible) {
        render(state);
      } else {
        unmount(domId);
      }
    },
    false
  );

  // In case someone else in the network does the dispatching
  eventBus.onDispatch((event) => {
    const eventToRemove = state.queue.findIndex(
      (e) => e.invocationUuid === event.invocationUuid
    );
    if (eventToRemove >= 0) {
      state.queue.splice(eventToRemove, 1);
      if (state.queue.length > 0) {
        render(state);
      } else {
        unmount(domId);
      }
    }
  });

  eventBus.onCapture((event) => {
    const hookIndex = state.hooks.findIndex((hook) =>
      hook.uuidMask.test(event.interceptorUuid)
    );
    if (hookIndex > -1) {
      const hook = state.hooks[hookIndex];
      const delayMs = hook.hookConfiguration.delayMs;
      const hookType = hook.hookConfiguration.hook;

      console.info(
        `Triggering ${hookType} hook (#${hook.hitCount}) for "${
          hook.uuidMask
        }"${delayMs > 0 ? ` delay ${delayMs}ms` : ""}`
      );

      if (hookType === "pass-through") {
        hook.hitCount++;
        setTimeout(() => {
          eventBus.dispatch({
            ...event,
            direction: "dispatch",
            sourceUuid: [],
          });
        }, delayMs);
      } else if (hookType === "suspend") {
        state.queue.push(event);
      } else {
        `Ignoring unsupported ${hookType} hook for "${hook.uuidMask}"`;
      }

      render(state);
    } else {
      console.info("Ignoring event, not matching a hook");
    }
  });
}
