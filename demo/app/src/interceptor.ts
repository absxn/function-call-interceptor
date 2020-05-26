import {
  CallEvent,
  EventBus,
  EventBusEvent,
  InterceptedFunction,
  InterceptEvent,
  ReturnEvent,
  Trigger,
} from "./types";

// Though this version is not cryptographically safe
function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function busEvents(bus: EventBus, uuid: string) {
  return {
    onDispatch<T extends { uuid: string }>(eventListener: (e: T) => void) {
      const listener = (event: EventBusEvent<T>) => {
        // Handle only own events
        if (event.detail.uuid !== uuid) {
          console.warn(`[${uuid}] Discarded return ${JSON.stringify(event)}`);
          return;
        }

        eventListener(event.detail);

        bus.removeEventListener("dispatch", listener);
      };
      bus.addEventListener("dispatch", listener);
    },
    capture<T extends InterceptEvent>(detail: T) {
      const event: EventBusEvent<T> = {
        type: "intercept",
        detail,
      };

      bus.dispatchEvent(event);
    },
  };
}

export function intercept<
  C extends InterceptedFunction,
  A extends Parameters<C>
>(eventBus: EventBus, cb: C, trigger: Trigger): C {
  const uuid = uuidv4();

  const events = busEvents(eventBus, uuid);

  return async function () {
    const originalArgs = Array.from(arguments);

    // Call interceptor
    const interceptedArgs = await new Promise<A[]>((resolve) => {
      if (trigger === "call" || trigger === "both") {
        console.info(
          `[${uuid}] Intercepted call function(${originalArgs
            .map((a) => JSON.stringify(a))
            .join(", ")}) => ?`
        );

        events.onDispatch<CallEvent>((callEvent) => {
          resolve(callEvent.args);
        });

        events.capture({
          uuid,
          args: originalArgs,
          trigger: "call",
        });
      } else {
        resolve(originalArgs);
      }
    });

    // Return interceptor
    return new Promise(async (resolve) => {
      // Bypass never calls the original code
      const returnValue = await (trigger === "bypass"
        ? Promise.resolve<any>("???") // <V> may be anything
        : (() => {
            console.info(
              `[${uuid}] Calling function(${originalArgs
                .map((a) => JSON.stringify(a))
                .join(", ")}) => ?`
            );
            return interceptedArgs.length === 0
              ? cb()
              : cb(...(interceptedArgs as A[]));
          })());

      if (trigger === "return" || trigger === "both" || trigger === "bypass") {
        console.info(
          `[${uuid}] Intercepted return value => ${JSON.stringify(returnValue)}`
        );

        events.capture({
          args: interceptedArgs,
          rv: returnValue,
          trigger: "return",
          uuid,
        });

        events.onDispatch<ReturnEvent>((event) => {
          resolve(event.rv);
        });
      } else {
        resolve(returnValue);
      }
    }).then((returnValue) => {
      console.info(`[${uuid}] Returning => ${JSON.stringify(returnValue)}`);

      return returnValue;
    });
  } as C;
}
