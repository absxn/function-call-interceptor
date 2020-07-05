import React from "react";
import ReactDOM from "react-dom";
import { RenderState } from "./types";
import InterceptorModal from "./FunctionComponents/InterceptorModal";

function render(props: RenderState): void {
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
    ReactDOM.render(
      <React.StrictMode>
        <button onClick={() => onToggleVisible(!visible)}>
          Show dispatcher (<code>`</code>)
        </button>
      </React.StrictMode>,
      document.getElementById(domId)
    );
  } else {
    ReactDOM.render(
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
}

export default render;
