import React, { CSSProperties } from "react";
import {
  ActiveHooks,
  CapturedEvents,
  DispatchSubmitHandler,
  OnHookAdd,
  OnHookRemove,
} from "../types";
import HookModal from "../FunctionComponents/HookModal";
import DispatchModal from "../Components/DispatchModal";

const DisabledStyle: CSSProperties = {
  backgroundColor: "#eee",
};

const InterceptorModalStyles: CSSProperties = {
  position: "fixed",
  right: 0,
  top: 0,
  minWidth: "50%",
  backgroundColor: "white",
  border: "1px solid red",
  margin: "20px",
  padding: "20px",
};

interface InterceptorModalProps {
  visible: boolean;
  onDispatchSubmit: DispatchSubmitHandler;
  queue: CapturedEvents;
  hooks: ActiveHooks;
  onHookAdd: OnHookAdd;
  onHookRemove: OnHookRemove;
}

export default class InterceptorModal extends React.Component<
  InterceptorModalProps
> {
  render(): JSX.Element {
    return (
      <fieldset
        style={{
          ...InterceptorModalStyles,
          ...(!this.props.visible ? DisabledStyle : {}),
        }}
        disabled={!this.props.visible}
      >
        <h1>
          Interceptor (toggle with <code>`</code> backtick)
        </h1>
        <HookModal
          hooks={this.props.hooks}
          onAdd={this.props.onHookAdd}
          onRemove={this.props.onHookRemove}
        />
        {this.props.queue.length > 0 && <DispatchModal {...this.props} />}
      </fieldset>
    );
  }
}
