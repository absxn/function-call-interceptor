import React, { ChangeEvent, CSSProperties } from "react";
import ReactDOM from "react-dom";
import {
  InterceptBus,
  CaptureEvent,
  Trigger,
  DispatchEvent,
  DispatchOptions,
} from "@interceptor/lib";

type EventQueue = Array<CaptureEvent>;

interface InterceptorModalProps {
  visible: boolean;
  onDispatch: (eventToRemove: number, event: DispatchEvent) => void;
  queue: EventQueue;
}

interface InterceptorModalState {
  activeEvent: number | -1;
  editedData: string;
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

const DisabledStyle: CSSProperties = {
  backgroundColor: "#eee",
};

const ActiveEventStyle: CSSProperties = {
  color: "red",
  textDecoration: "underline",
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
      <fieldset
        style={{
          ...InterceptorModalStyles,
          ...(!this.props.visible ? DisabledStyle : {}),
        }}
        disabled={!this.props.visible}
      >
        <h1>Intercepted</h1>
        <h2>Queue</h2>
        <ol>
          {queue.map((e, index) => {
            const uuidString = `${e.interceptorUuid.split("-")[0]}.${
              e.invocationUuid.split("-")[0]
            }`;
            return (
              <li
                key={index}
                style={index === activeEvent ? ActiveEventStyle : {}}
              >
                <span
                  onClick={() => {
                    this.setState({
                      activeEvent: index,
                      editedData: loadData(this.props.queue, index),
                    });
                  }}
                >
                  uuid({uuidString}
                  {") "}
                  {e.trigger === Trigger.call ? (
                    <code>call({JSON.stringify(e.args)}) =&gt; ?</code>
                  ) : (
                    <code>
                      return({JSON.stringify(e.args)}) =&gt;{" "}
                      {JSON.stringify(e.rv)}
                    </code>
                  )}
                </span>
              </li>
            );
          })}
        </ol>
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

            this.props.onDispatch(activeEvent, response);
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
      </fieldset>
    );
  }

  updateValue(event: ChangeEvent<HTMLTextAreaElement | HTMLSelectElement>) {
    this.setState({ editedData: event.currentTarget.value });
  }
}

// https://stackoverflow.com/a/2117523
function render(
  domId: string,
  queue: EventQueue,
  respond: (eventToRemove: number, event: DispatchEvent) => void
) {
  return ReactDOM.render(
    <React.StrictMode>
      <InterceptorModal queue={queue} visible={true} onDispatch={respond} />
    </React.StrictMode>,
    document.getElementById(domId)
  );
}

function unmount(domId: string) {
  const elementById = document.getElementById(domId);

  if (elementById === null) {
    throw new Error(`Can't find interceptor root element with #${domId}`);
  } else {
    ReactDOM.unmountComponentAtNode(elementById);
  }
}

export function mountInterceptorClient(domId: string, eventBus: InterceptBus) {
  const queue: EventQueue = [];

  function respond(eventToRemove: number, event: DispatchEvent) {
    queue.splice(eventToRemove, 1);

    eventBus.dispatch(event);

    unmount(domId);

    if (queue.length > 0) {
      render(domId, queue, respond);
    }
  }

  // In case someone else in the network does the dispatching
  eventBus.onDispatch((event) => {
    const eventToRemove = queue.findIndex(
      (e) => e.invocationUuid === event.invocationUuid
    );
    if (eventToRemove >= 0) {
      queue.splice(eventToRemove, 1);
      if (queue.length > 0) {
        render(domId, queue, respond);
      } else {
        unmount(domId);
      }
    }
  });

  eventBus.onCapture((event) => {
    queue.push(event);
    render(domId, queue, respond);
  });
}
