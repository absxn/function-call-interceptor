import React from "react";
import cx from "classnames";
import "./InterceptorModal.css";

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
