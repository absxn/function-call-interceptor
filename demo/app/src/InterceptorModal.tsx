import React from "react";
import cx from "classnames";
import "./InterceptorModal.css";
import ReactDOM from "react-dom";

interface CallEvent extends Event {
  args?: any[];
}

interface InterceptorModalProps {
  visible: boolean;
  onResponse: () => void;
  queue: CallEvent[];
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
                call(<code>{JSON.stringify(e.args)}</code>)
              </span>
            </li>
          ))}
        </ol>
        <h2>Call</h2>
        <pre>{JSON.stringify(queue[activeEvent])}</pre>
        <button onClick={this.props.onResponse}>Dispatch</button>
        <h2>Return</h2>
        <pre>Bar</pre>
        <button onClick={this.props.onResponse}>Return</button>
      </fieldset>
    );
  }
}

const eventBus = new EventTarget();

export function intercept<A extends any, R extends Promise<V>, V extends any>(
  cb: (() => R) | ((...args: A[]) => R)
): (() => Promise<V>) | ((...args: A[]) => Promise<V>) {
  return function () {
    const a = Array.from(arguments);
    const returnValue = a.length === 0 ? cb() : cb(...(a as A[]));
    console.log(`intercept(${a.join(", ")})`);
    const event = new Event("call") as CallEvent;
    event.args = a;
    eventBus.dispatchEvent(event);

    return new Promise<V>((resolve) => {
      function responseListener() {
        eventBus.removeEventListener("response", responseListener);
        resolve(returnValue);
      }
      eventBus.addEventListener("response", responseListener);
    });
  };
}

function render(domId: string, queue: CallEvent[], respond: () => void) {
  return ReactDOM.render(
    <React.StrictMode>
      <InterceptorModal queue={queue} visible={true} onResponse={respond} />
    </React.StrictMode>,
    document.getElementById(domId)
  );
}

export function mountInterceptorClient(domId: string) {
  const queue: Event[] = [];

  function respond() {
    queue.splice(0, 1);

    if (queue.length > 0) {
      render(domId, queue, respond);
    } else {
      eventBus.dispatchEvent(new Event("response"));

      const elementById = document.getElementById(domId);
      if (elementById === null) {
        throw new Error(`Can't find interceptor root element with #${domId}`);
      } else {
        ReactDOM.unmountComponentAtNode(elementById);
      }
    }
  }

  eventBus.addEventListener("call", function requestListener(event) {
    queue.push(event);

    render(domId, queue, respond);
  });
}
