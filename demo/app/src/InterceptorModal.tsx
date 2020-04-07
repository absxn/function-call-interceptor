import React from "react";
import cx from "classnames";
import "./InterceptorModal.css";
import ReactDOM from "react-dom";

interface InterceptorModalProps {
  visible: boolean;
  onResponse: () => void;
}

export default class InterceptorModal extends React.Component<
  InterceptorModalProps
> {
  render() {
    return (
      <fieldset
        className={cx("interceptorModal", { disabled: !this.props.visible })}
        disabled={!this.props.visible}
      >
        <h1>Intercepted</h1>
        <h2>Call</h2>
        <pre>Foo</pre>
        <button onClick={this.props.onResponse}>Dispatch</button>
        <h2>Return</h2>
        <pre>Bar</pre>
        <button onClick={this.props.onResponse}>Return</button>
      </fieldset>
    );
  }
}

const eventBus = new EventTarget();

interface CallEvent extends Event {
  options: number;
}

export function intercept<A extends any, R extends Promise<V>, V extends any>(
  cb: (() => R) | ((...args: A[]) => R)
): (() => Promise<V>) | ((...args: A[]) => Promise<V>) {
  return function () {
    const a = Array.from(arguments);
    const returnValue = a.length === 0 ? cb() : cb(...(a as A[]));
    console.log(`intercept(${a.join(", ")})`);
    const event = new Event("call") as CallEvent;
    event.options = 1;
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

export function mountInterceptorClient(domId: string) {
  function respond() {
    eventBus.dispatchEvent(new Event("response"));

    const elementById = document.getElementById(domId);
    if (elementById === null) {
      throw new Error(`Can't find interceptor root element with #${domId}`);
    } else {
      ReactDOM.unmountComponentAtNode(elementById);
    }
  }

  eventBus.addEventListener("call", function requestListener(event) {
    return ReactDOM.render(
      <React.StrictMode>
        <InterceptorModal visible={true} onResponse={respond} />
      </React.StrictMode>,
      document.getElementById(domId)
    );
  });
}
