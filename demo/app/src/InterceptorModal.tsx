import React from "react";
import cx from "classnames";
import "./InterceptorModal.css";
import ReactDOM from "react-dom";

interface InterceptorModalProps {
  visible: boolean;
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
        <button>Dispatch</button>
        <h2>Return</h2>
        <pre>Bar</pre>
        <button>Return</button>
      </fieldset>
    );
  }
}


export function intercept<A extends any, R extends Promise<V>, V extends any>(
  cb: (() => R) | ((...args: A[]) => R)
): (() => R) | ((...args: A[]) => R) {
  return function () {
    const a = Array.from(arguments);
    const returnValue = (a.length === 0 ? cb() : cb(...(a as A[])));
    console.log(`intercept(${a.join(", ")})`);
    return returnValue;
  };
}

export function mountInterceptorClient(domId: string) {
  return ReactDOM.render(
      <React.StrictMode>
        <InterceptorModal visible={true} />
      </React.StrictMode>,
      document.getElementById(domId)
  );
}
