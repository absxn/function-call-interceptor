import React from "react";
import cx from "classnames";
import "./InterceptorModal.css";
import ReactDOM from "react-dom";

type Trigger = "call" | "return" | "both";

interface CallEvent extends Event {
  trigger: "call";
  uuid: string;
  args?: any[];
}

interface ReturnEvent extends Event {
  trigger: "return";
  uuid: string;
  args?: any[];
  rv?: any;
}

type InterceptEvent = CallEvent | ReturnEvent;

type EventQueue = Array<InterceptEvent>;

interface InterceptorModalProps {
  visible: boolean;
  onResponse: (eventToRemove: number, event: InterceptEvent) => void;
  queue: EventQueue;
}

interface InterceptorModalState {
  activeEvent: number | -1;
}

export default class InterceptorModal extends React.Component<
  InterceptorModalProps,
  InterceptorModalState
> {
  state = {
    activeEvent: 0,
  };

  render() {
    const activeEvent = this.state.activeEvent;
    const queue = this.props.queue;
    const interceptEvent = queue[activeEvent];

    return (
      <fieldset
        className={cx("interceptorModal", { disabled: !this.props.visible })}
        disabled={!this.props.visible}
      >
        <h1>Intercepted</h1>
        <h2>Queue</h2>
        <ol className="eventSelector">
          {queue.map((e, index) => (
            <li
              key={index}
              className={cx({ activeEvent: index === activeEvent })}
            >
              <span
                onClick={() => {
                  this.setState({ activeEvent: index });
                }}
              >
                {e.trigger === "call" ? (
                  <code>call({JSON.stringify(e.args)}) => ?</code>
                ) : (
                  <code>
                    return({JSON.stringify(e.args)}) =>{" "}
                    {JSON.stringify(e.returnValue)}
                  </code>
                )}
              </span>
            </li>
          ))}
        </ol>
        <h2>{interceptEvent.trigger}</h2>
        <pre>{JSON.stringify(interceptEvent)}</pre>
        <button
          onClick={() => {
            const response = new Event("response") as InterceptEvent;
            response.trigger = interceptEvent.trigger;
            response.uuid = interceptEvent.uuid;
            response.args = interceptEvent.args;
            if (
              response.trigger === "return" &&
              interceptEvent.trigger === "return"
            ) {
              response.rv = interceptEvent.rv;
            }
            this.props.onResponse(activeEvent, response);
          }}
        >
          Dispatch
        </button>
      </fieldset>
    );
  }
}

const eventBus = new EventTarget();

// https://stackoverflow.com/a/2117523
// Though this version is not cryptographically safe
function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function intercept<A extends any, R extends Promise<V>, V extends any>(
  cb: (() => R) | ((...args: A[]) => R),
  trigger: Trigger
): (() => Promise<V>) | ((...args: A[]) => Promise<V>) {
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
        const event = new Event("call") as CallEvent;
        event.uuid = uuid;
        event.args = originalArgs;
        event.trigger = "call";

        function responseListener(event: Event) {
          const callEvent = event as CallEvent;

          // Handle only own events
          if (callEvent.uuid !== uuid) {
            console.warn(`[${uuid}] Discarded call ${JSON.stringify(event)}`);
            return;
          }

          eventBus.removeEventListener("response", responseListener);
          resolve(callEvent.args);
        }

        eventBus.addEventListener("response", responseListener);

        eventBus.dispatchEvent(event);
      } else {
        resolve(originalArgs);
      }
    });

    // Return interceptor
    return new Promise<V>((resolve) => {
      console.info(
        `[${uuid}] Calling function(${originalArgs
          .map((a) => JSON.stringify(a))
          .join(", ")}) => ?`
      );
      const returnValue =
        interceptedArgs.length === 0 ? cb() : cb(...(interceptedArgs as A[]));

      if (trigger === "return" || trigger === "both") {
        const event = new Event("call") as ReturnEvent;
        event.trigger = "return";
        event.uuid = uuid;
        console.info(
          `[${uuid}] Intercepted return value => ${JSON.stringify(returnValue)}`
        );
        event.args = interceptedArgs;
        event.rv = returnValue;
        eventBus.dispatchEvent(event);

        function responseListener(event: Event) {
          const returnEvent = event as ReturnEvent;

          // Handle only own events
          if (returnEvent.uuid !== uuid) {
            console.warn(`[${uuid}] Discarded return ${JSON.stringify(event)}`);
            return;
          }

          eventBus.removeEventListener("response", responseListener);
          resolve(returnEvent.rv);
        }

        eventBus.addEventListener("response", responseListener);
      } else {
        resolve(returnValue);
      }
    }).then((returnValue) => {
      console.info(`[${uuid}] Returning => ${JSON.stringify(returnValue)}`);

      return returnValue;
    });
  };
}

function render(
  domId: string,
  queue: EventQueue,
  respond: (eventToRemove: number, event: InterceptEvent) => void
) {
  return ReactDOM.render(
    <React.StrictMode>
      <InterceptorModal queue={queue} visible={true} onResponse={respond} />
    </React.StrictMode>,
    document.getElementById(domId)
  );
}

export function mountInterceptorClient(domId: string) {
  const queue: EventQueue = [];

  function respond(eventToRemove: number, event: InterceptEvent) {
    queue.splice(eventToRemove, 1);

    console.info(`Dispatched ${JSON.stringify(event)}`);
    eventBus.dispatchEvent(event);

    const elementById = document.getElementById(domId);
    if (elementById === null) {
      throw new Error(`Can't find interceptor root element with #${domId}`);
    } else {
      ReactDOM.unmountComponentAtNode(elementById);
    }

    if (queue.length > 0) {
      render(domId, queue, respond);
    }
  }

  eventBus.addEventListener("call", function requestListener(event) {
    // TODO: Ensure type
    const callEvent = event as CallEvent;

    queue.push(callEvent);

    render(domId, queue, respond);
  });
}
