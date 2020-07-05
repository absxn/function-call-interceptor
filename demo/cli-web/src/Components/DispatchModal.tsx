import React, { ChangeEvent, CSSProperties } from "react";
import { CaptureEvent, DispatchOptions, Trigger } from "@interceptor/lib";
import EventQueue from "../FunctionComponents/EventQueue";
import {
  ActiveHooks,
  CapturedEvents,
  DispatchSubmitHandler,
  HookConfiguration,
} from "../types";

const EditorStyle: CSSProperties = {
  display: "block",
  padding: "5px",
  width: "100%",
  margin: "10px 20px",
  boxSizing: "border-box",
  backgroundColor: "lightyellow",
  border: "1px solid #999",
  fontFamily: "monospace",
};

const ErrorStyle: CSSProperties = {
  backgroundColor: "lightcoral",
};

interface DispatchModalProps {
  visible: boolean;
  onDispatchSubmit: DispatchSubmitHandler;
  queue: CapturedEvents;
  hooks: ActiveHooks;
}

interface DispatchModalState {
  activeEvent: number | -1;
  editedData: string;
  hookConfiguration: HookConfiguration;
}

function loadData(queue: CaptureEvent[], index: number): string {
  if (queue.length === 0) {
    throw new Error("Unexpected zero queue length");
  }
  const detail = queue[index];
  return JSON.stringify(
    detail.trigger === Trigger.call ? detail.args : detail.rv
  );
}

function isValidJsonString(jsonString: string) {
  try {
    JSON.parse(jsonString);
    return true;
  } catch {
    return false;
  }
}

export default class DispatchModal extends React.Component<
  DispatchModalProps,
  DispatchModalState
> {
  state = {
    activeEvent: 0,
    editedData: loadData(this.props.queue, 0),
    hookConfiguration: { hook: "suspend" as const, delayMs: 0 },
  };

  render(): JSX.Element {
    const activeEvent = this.state.activeEvent;
    const queue = this.props.queue;
    const interceptEvent = queue[this.state.activeEvent];
    const validInput = isValidJsonString(this.state.editedData);
    const originalData = loadData(queue, this.state.activeEvent);
    const dispatchOptions: DispatchOptions =
      interceptEvent.trigger === Trigger.call
        ? interceptEvent.dispatchOptionsArguments || []
        : interceptEvent.dispatchOptionsReturnValue || [];
    const inputOptions = dispatchOptions
      .map((option) => JSON.stringify(option.value))
      .concat([originalData]);
    const notEditable =
      interceptEvent.dispatchOptionOverride === false &&
      !inputOptions.includes(this.state.editedData);
    const dispatchOption = (args, index) => {
      const value = JSON.stringify(args.value);
      const label = args.label || "";
      return (
        <option key={index} value={value}>
          {label ? `${label}: ` : ""}
          {value}
        </option>
      );
    };

    return (
      <>
        <h2>Queue</h2>
        <EventQueue
          activeEvent={activeEvent}
          queue={queue}
          onClick={(index) => {
            this.setState({
              activeEvent: index,
              editedData: loadData(this.props.queue, index),
            });
          }}
        />
        {interceptEvent.trigger === Trigger.call ? (
          <>
            <h2>Arguments</h2>
            <h3>Suggested arguments</h3>
            <select onChange={this.updateValue.bind(this)}>
              <option value={originalData}>Input: {originalData}</option>
              {(interceptEvent.dispatchOptionsArguments || []).map(
                dispatchOption
              )}
            </select>
            <h3>Arguments to dispatch</h3>
            <pre>function(</pre>
            <textarea
              style={{ ...EditorStyle, ...(!validInput ? ErrorStyle : {}) }}
              onChange={this.updateValue.bind(this)}
              value={this.state.editedData}
            />
            <pre>) =&gt; ?</pre>
          </>
        ) : (
          <>
            <h2>Return value</h2>
            <h3>Suggested arguments</h3>
            <select onChange={this.updateValue.bind(this)}>
              <option value={originalData}>Input: {originalData}</option>
              {(interceptEvent.dispatchOptionsReturnValue || []).map(
                dispatchOption
              )}
            </select>
            <h3>Dispatch return value</h3>
            <pre>function({JSON.stringify(interceptEvent.args)}) =&gt;</pre>
            <textarea
              style={{ ...EditorStyle, ...(!validInput ? ErrorStyle : {}) }}
              onChange={this.updateValue.bind(this)}
              value={this.state.editedData}
            />
          </>
        )}
        <h2>
          Hook for <code>{interceptEvent.interceptorUuid}</code>
        </h2>
        <button
          disabled={this.state.editedData === originalData}
          onClick={() => {
            this.setState({
              editedData: originalData,
            });
          }}
        >
          Reset
        </button>
        <button
          disabled={!validInput || notEditable}
          onClick={() => {
            const editedData = this.state.editedData;
            if (editedData === null || editedData === undefined) {
              throw new Error("Can't submit broken data");
            }

            const response =
              interceptEvent.trigger === Trigger.call
                ? {
                    ...interceptEvent,
                    direction: "dispatch" as const,
                    sourceUuid: [],
                    args: JSON.parse(editedData),
                  }
                : {
                    ...interceptEvent,
                    direction: "dispatch" as const,
                    sourceUuid: [],
                    rv: JSON.parse(editedData),
                  };

            this.props.onDispatchSubmit(activeEvent, response, {
              ...this.state.hookConfiguration,
            });
          }}
        >
          Dispatch{!validInput && " (malformed JSON input)"}
          {notEditable && " (custom input not accepted)"}
        </button>
        <h3>Raw event</h3>
        <div
          style={{
            fontFamily: "monospace",
            whiteSpace: "pre",
            fontSize: "10px",
          }}
        >
          {JSON.stringify(interceptEvent, null, 2)}
        </div>
      </>
    );
  }

  updateValue(
    event: ChangeEvent<HTMLTextAreaElement | HTMLSelectElement>
  ): void {
    this.setState({ editedData: event.currentTarget.value });
  }
}
