// Bypass never calls the original code
export interface BypassEvent {
  trigger: "bypass";
  uuid: string;
  args?: any[];
  rv?: any;
}

export interface CallEvent {
  trigger: "call";
  uuid: string;
  args?: any[];
}

export interface ReturnEvent {
  trigger: "return";
  uuid: string;
  args?: any[];
  rv?: any;
}

export type InterceptEvent = BypassEvent | CallEvent | ReturnEvent;

export type Trigger = "bypass" | "call" | "return" | "both";

// Though this version is not cryptographically safe
function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

type InterceptedFunction =
  | (() => Promise<any>)
  | ((...args: any[]) => Promise<any>);

export interface EventBusEvent<T> {
  type: string;
  detail: T;
}

export interface EventBus {
  addEventListener: (typ: string, el: (e: EventBusEvent<any>) => void) => void;
  dispatchEvent: (e: EventBusEvent<any>) => void;
  removeEventListener: (
    typ: string,
    el: (e: EventBusEvent<any>) => void
  ) => void;
}

export function intercept<
  C extends InterceptedFunction,
  A extends Parameters<C>
>(eventBus: EventBus, cb: C, trigger: Trigger): C {
  const uuid = uuidv4();

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
        const event: EventBusEvent<CallEvent> = {
          type: "call",
          detail: {
            uuid,
            args: originalArgs,
            trigger: "call",
          },
        };

        const responseListener = (callEvent: EventBusEvent<CallEvent>) => {
          // Handle only own events
          if (callEvent.detail.uuid !== uuid) {
            console.warn(`[${uuid}] Discarded call ${JSON.stringify(event)}`);
            return;
          }

          eventBus.removeEventListener("response", responseListener);
          resolve(callEvent.detail.args);
        };

        eventBus.addEventListener("response", responseListener);

        eventBus.dispatchEvent(event);
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
        const event: EventBusEvent<ReturnEvent> = {
          type: "call",
          detail: {
            args: interceptedArgs,
            rv: returnValue,
            trigger: "return",
            uuid,
          },
        };
        console.info(
          `[${uuid}] Intercepted return value => ${JSON.stringify(returnValue)}`
        );
        eventBus.dispatchEvent(event);

        const responseListener = (event: EventBusEvent<ReturnEvent>) => {
          const returnEvent = event;

          // Handle only own events
          if (returnEvent.detail.uuid !== uuid) {
            console.warn(`[${uuid}] Discarded return ${JSON.stringify(event)}`);
            return;
          }

          eventBus.removeEventListener("response", responseListener);
          resolve(returnEvent.detail.rv);
        };

        eventBus.addEventListener("response", responseListener);
      } else {
        resolve(returnValue);
      }
    }).then((returnValue) => {
      console.info(`[${uuid}] Returning => ${JSON.stringify(returnValue)}`);

      return returnValue;
    });
  } as C;
}
