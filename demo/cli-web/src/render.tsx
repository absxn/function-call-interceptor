import React, { CSSProperties } from "react";
import ReactDOM from "react-dom";
import { RenderState } from "./types";
import InterceptorModal from "./FunctionComponents/InterceptorModal";

function render(props: RenderState) {
  const {
    queue,
    hooks,
    visible,
    domId,
    onToggleVisible,
    onDispatchSubmit,
    onHookAdd,
    onHookRemove,
  } = props;

  if (queue.length === 0 && hooks.length === 0 && visible === false) {
    // unmount(domId);
    return;
  }

  if (!visible) {
    return ReactDOM.render(
      <React.StrictMode>
        <button onClick={() => onToggleVisible(!visible)}>
          Show dispatcher (<code>`</code>)
        </button>
      </React.StrictMode>,
      document.getElementById(domId)
    );
  }

  return ReactDOM.render(
    <React.StrictMode>
      <InterceptorModal
        hooks={hooks}
        queue={queue}
        visible={true}
        onDispatchSubmit={onDispatchSubmit}
        onHookAdd={onHookAdd}
        onHookRemove={onHookRemove}
      />
    </React.StrictMode>,
    document.getElementById(domId)
  );
}

export default render;
