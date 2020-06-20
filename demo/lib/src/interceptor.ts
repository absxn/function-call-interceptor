import {
  InterceptBus,
  InterceptedFunction,
  InterceptEvent,
  InterceptOptions,
  RemoveListener,
  Trigger,
  uuidv4,
} from "./types";

function busEvents(bus: InterceptBus, invocationUuid: string) {
  return {
    onDispatch(eventListener: (e: InterceptEvent) => void) {
      let removeListener: RemoveListener;
      const listener = (event: InterceptEvent) => {
        // Handle only own events
        if (event.invocationUuid !== invocationUuid) {
          console.warn(
            `[${invocationUuid}] Discarded return ${JSON.stringify(event)}`
          );
          return;
        }

        eventListener(event);

        removeListener();
      };
      removeListener = bus.onDispatch(listener);
    },
    capture(event: InterceptEvent) {
      bus.capture(event);
    },
  };
}

export type Interceptor<
  C extends InterceptedFunction,
  A extends Parameters<C>
> = (cb: C, options: InterceptOptions<C>) => C;

export function intercept<
  C extends InterceptedFunction,
  A extends Parameters<C>
>(eventBus: InterceptBus, cb: C, options: InterceptOptions<C>): C {
  const interceptorUuid = options.uuid || uuidv4();

  return async function () {
    const invocationUuid = uuidv4();

    const events = busEvents(eventBus, invocationUuid);

    const originalArgs = Array.from(arguments);

    const uuidString = `${interceptorUuid.split("-")[0]}.${
      invocationUuid.split("-")[0]
    }`;

    // Call interceptor
    const interceptedArgs = await new Promise<A[]>((resolve) => {
      if (
        options.trigger === Trigger.call ||
        options.trigger === Trigger.both
      ) {
        console.info(
          `[${uuidString}] Intercepted call function(${originalArgs
            .map((a) => JSON.stringify(a))
            .join(", ")}) => ?`
        );

        events.onDispatch((callEvent) => {
          resolve(callEvent.args);
        });

        events.capture({
          interceptorUuid,
          invocationUuid,
          args: originalArgs,
          trigger: Trigger.call,
          direction: "capture",
          sourceUuid: [],
          dispatchOptionOverride: options.dispatchOptionOverride,
          dispatchOptionsArguments: options.dispatchOptionsArguments,
        });
      } else {
        resolve(originalArgs);
      }
    });

    // Return interceptor
    return new Promise(async (resolve) => {
      // Bypass never calls the original code
      const returnValue = await (options.trigger === Trigger.bypass
        ? Promise.resolve<any>("???") // <V> may be anything
        : (() => {
            console.info(
              `[${uuidString}] Calling function(${originalArgs
                .map((a) => JSON.stringify(a))
                .join(", ")}) => ?`
            );
            return interceptedArgs.length === 0
              ? cb()
              : cb(...(interceptedArgs as A[]));
          })());

      if (
        options.trigger === Trigger.return ||
        options.trigger === Trigger.both ||
        options.trigger === Trigger.bypass
      ) {
        console.info(
          `[${uuidString}] Intercepted return value => ${JSON.stringify(
            returnValue
          )}`
        );

        events.capture({
          args: interceptedArgs,
          invocationUuid,
          rv: returnValue,
          trigger: Trigger.return,
          interceptorUuid,
          direction: "capture",
          sourceUuid: [],
          dispatchOptionOverride: options.dispatchOptionOverride,
          dispatchOptionsReturnValue: options.dispatchOptionsReturnValue,
        });

        events.onDispatch((event) => {
          if (event.trigger !== Trigger.return) {
            throw new Error(
              `Expected return event, got ${JSON.stringify(event)}`
            );
          }
          resolve(event.rv);
        });
      } else {
        resolve(returnValue);
      }
    }).then((returnValue) => {
      console.info(
        `[${uuidString}] Returning => ${JSON.stringify(returnValue)}`
      );

      return returnValue;
    });
  } as C;
}
