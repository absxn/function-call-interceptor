import React, { ChangeEvent } from "react";
import cx from "classnames";
import "./InterceptorModal.css";
import ReactDOM from "react-dom";

type Trigger = "call" | "return" | "both";

interface CallEvent {
  trigger: "call";
  uuid: string;
  args?: any[];
}

interface ReturnEvent {
  trigger: "return";
  uuid: string;
  args?: any[];
  rv?: any;
}

type InterceptEvent = CallEvent | ReturnEvent;

type EventQueue = Array<CustomEvent<InterceptEvent>>;

interface InterceptorModalProps {
  visible: boolean;
  onResponse: (
    eventToRemove: number,
    event: CustomEvent<InterceptEvent>
  ) => void;
  queue: EventQueue;
}

interface InterceptorModalState {
  activeEvent: number | -1;
  editedData: Pick<ReturnEvent, "rv"> | Pick<CallEvent, "args">;
}

function loadData(queue: CustomEvent<InterceptEvent>[], index: number) {
  const detail = queue[index].detail;
  return detail.trigger === "call" ? detail.args : detail.rv;
}

export default class InterceptorModal extends React.Component<
  InterceptorModalProps,
  InterceptorModalState
> {
  state = {
    activeEvent: 0,
    editedData: loadData(this.props.queue, 0),
  };

  render() {
    const activeEvent = this.state.activeEvent;
    const queue = this.props.queue;
    const interceptEvent = queue[this.state.activeEvent];
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
                  this.setState({
                    activeEvent: index,
                    editedData: loadData(this.props.queue, index),
                  });
                }}
              >
                {e.detail.trigger === "call" ? (
                  <code>call({JSON.stringify(e.detail.args)}) => ?</code>
                ) : (
                  <code>
                    return({JSON.stringify(e.detail.args)}) =>{" "}
                    {JSON.stringify(e.detail.rv)}
                  </code>
                )}
              </span>
            </li>
          ))}
        </ol>
        {interceptEvent.detail.trigger === "call" ? (
          <>
            <h2>Arguments</h2>
            <pre>function(</pre>
            <textarea
              className="editor"
              onChange={this.updateArgs.bind(this)}
              value={JSON.stringify(this.state.editedData)}
            />
            <pre>) => ?</pre>
          </>
        ) : (
          <>
            <h2>Return value</h2>
            <pre>function({JSON.stringify(interceptEvent.detail.args)}) =></pre>
            <textarea
              className="editor"
              onChange={this.updateReturnValue.bind(this)}
              value={JSON.stringify(this.state.editedData)}
            />
          </>
        )}
        <button
          onClick={() => {
            const editedData = this.state.editedData;
            if (editedData === null || editedData === undefined) {
              throw new Error("Can't submit broken data");
            }

            const response =
              interceptEvent.detail.trigger === "call"
                ? new CustomEvent<CallEvent>("response", {
                    detail: {
                      ...interceptEvent.detail,
                      args: editedData,
                    },
                  })
                : new CustomEvent<ReturnEvent>("response", {
                    detail: {
                      ...interceptEvent.detail,
                      rv: editedData,
                    },
                  });

            this.props.onResponse(activeEvent, response);
          }}
        >
          Dispatch
        </button>
      </fieldset>
    );
  }

  updateArgs(event: ChangeEvent<HTMLTextAreaElement>) {
    if (this.props.queue[this.state.activeEvent].detail.trigger !== "call") {
      throw new Error("Not a call event");
    }
    this.setState({ editedData: JSON.parse(event.currentTarget.value) });
  }

  updateReturnValue(event: ChangeEvent<HTMLTextAreaElement>) {
    if (this.props.queue[this.state.activeEvent].detail.trigger !== "return") {
      throw new Error("Not a return event");
    }
    this.setState({ editedData: JSON.parse(event.currentTarget.value) });
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
        const event = new CustomEvent<CallEvent>("call", {
          detail: {
            uuid,
            args: originalArgs,
            trigger: "call",
          },
        });

        const responseListener =
          ((callEvent: CustomEvent<CallEvent>) => {
            // Handle only own events
            if (callEvent.detail.uuid !== uuid) {
              console.warn(`[${uuid}] Discarded call ${JSON.stringify(event)}`);
              return;
            }

            eventBus.removeEventListener("response", responseListener);
            resolve(callEvent.detail.args);
          }) as EventListener;

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
        const event = new CustomEvent<ReturnEvent>("call", {
          detail: {
            args: interceptedArgs,
            rv: returnValue,
            trigger: "return",
            uuid,
          },
        });
        console.info(
          `[${uuid}] Intercepted return value => ${JSON.stringify(returnValue)}`
        );
        eventBus.dispatchEvent(event);

        const responseListener =
          ((event: CustomEvent<ReturnEvent>) => {
            const returnEvent = event;

            // Handle only own events
            if (returnEvent.detail.uuid !== uuid) {
              console.warn(
                `[${uuid}] Discarded return ${JSON.stringify(event)}`
              );
              return;
            }

            eventBus.removeEventListener("response", responseListener);
            resolve(returnEvent.detail.rv);
          }) as EventListener;

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
  respond: (eventToRemove: number, event: CustomEvent<InterceptEvent>) => void
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

  function respond(eventToRemove: number, event: CustomEvent<InterceptEvent>) {
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

  eventBus.addEventListener("call", function requestListener(
    event: CustomEvent<CallEvent>
  ) {
    queue.push(event);
    render(domId, queue, respond);
  } as EventListener);
}
