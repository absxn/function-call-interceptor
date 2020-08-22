import {
  InterceptBus,
  InterceptedFunction,
  InterceptOptions,
  RemoveListener,
  Trigger,
  uuidv4,
  DispatchHandler,
  CaptureHandler,
  DispatchEvent,
} from "./types";

function busEvents(
  bus: InterceptBus,
  invocationUuid: string
): {
  onDispatch: (handler: DispatchHandler) => RemoveListener;
  capture: CaptureHandler;
} {
  return {
    onDispatch(eventListener) {
      // eslint-disable-next-line prefer-const
      let removeListener: RemoveListener;
      const listener = (event: DispatchEvent) => {
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

      return removeListener;
    },
    capture(event) {
      bus.capture(event);
    },
  };
}

function expireOption(timeoutMs?: number) {
  return timeoutMs ? { expireAt: Date.now() + timeoutMs } : {};
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

    // eslint-disable-next-line prefer-rest-params
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

        let timeoutHandle;

        const removeListener = events.onDispatch((callEvent) => {
          clearTimeout(timeoutHandle);
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
          ...expireOption(options.timeoutMs),
        });

        if (options.timeoutMs) {
          timeoutHandle = setTimeout(() => {
            console.info(`[${uuidString}] Call timeout`);
            removeListener();
            resolve(originalArgs);
          }, options.timeoutMs);
        }
      } else {
        resolve(originalArgs);
      }
    });

    // Return interceptor
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve) => {
      // Bypass never calls the original code
      const returnValue = await (options.trigger === Trigger.bypass
        ? Promise.resolve<string>("???") // <V> may be anything
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
          ...expireOption(options.timeoutMs),
        });

        let timeoutHandle;

        const removeListener = events.onDispatch((event) => {
          if (event.trigger !== Trigger.return) {
            throw new Error(
              `Expected return event, got ${JSON.stringify(event)}`
            );
          }
          clearTimeout(timeoutHandle);
          resolve(event.rv);
        });

        if (options.timeoutMs) {
          timeoutHandle = setTimeout(() => {
            console.info(`[${uuidString}] Return timeout`);
            removeListener();
            resolve(returnValue);
          }, options.timeoutMs);
        }
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
