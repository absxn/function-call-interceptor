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

type ActiveHooks = Array<{
  interceptorUuid: string;
  hookConfiguration: HookConfiguration;
}>;

type DispatchSubmitHandler = (
  eventToRemove: number,
  event: DispatchEvent,
  hookConfiguration: HookConfiguration
) => void;

interface DispatchModalProps {
  visible: boolean;
  onDispatch: DispatchSubmitHandler;
  queue: EventQueue;
  hooks: ActiveHooks;
}

interface InterceptorModalState {
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

type HookTypes = "suspend" | "pass-through";

type HookConfiguration = {
  hook: HookTypes;
  delayMs: number;
};

const HookSelector: React.FC<{
  selected: HookConfiguration;
  onChange: (active: HookConfiguration) => void;
}> = (props) => {
  const { hook, delayMs } = props.selected;
  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      <li>
        <label>
          <input
            name="hook"
            value="suspend"
            type="radio"
            checked={hook === "suspend"}
            onChange={(e) => props.onChange({ hook: "suspend", delayMs })}
          />{" "}
          Suspend (default)
        </label>
      </li>
      <li>
        <label>
          <input
            name="hook"
            value="pass-through"
            type="radio"
            checked={hook === "pass-through"}
            onChange={(e) => props.onChange({ hook: "pass-through", delayMs })}
          />{" "}
          Pass-through
        </label>
      </li>
      <li>
        <label>
          Dispatch delay
          <input
            name="delay"
            value={delayMs}
            type="text"
            onChange={(e) =>
              props.onChange({
                hook: hook,
                delayMs: parseInt(e.currentTarget.value, 10),
              })
            }
          />
          ms
        </label>
      </li>
    </ul>
  );
};

interface HookModalProps {
  hooks: ActiveHooks;
  onRemove: (uuid: string) => void;
}

class HookModal extends React.Component<HookModalProps> {
  render() {
    return (
      <table style={{ width: "100%" }}>
        {this.props.hooks.map((hook) => (
          <tr key={hook.interceptorUuid}>
            <td>{hook.interceptorUuid}</td>
            <td>{hook.hookConfiguration.hook}</td>
            <td>{hook.hookConfiguration.delayMs}</td>
            <td
              style={{
                color: "red",
                textDecoration: "underline",
                cursor: "pointer",
              }}
              onClick={() => {
                this.props.onRemove(hook.interceptorUuid);
              }}
            >
              Remove
            </td>
          </tr>
        ))}
      </table>
    );
  }
}

class DispatchModal extends React.Component<
  DispatchModalProps,
  InterceptorModalState
> {
  state = {
    activeEvent: 0,
    editedData: loadData(this.props.queue, 0),
    hookConfiguration: { hook: "suspend" as const, delayMs: 0 },
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
      <>
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
        <h2>
          Hook for <code>{interceptEvent.interceptorUuid}</code>
        </h2>
        <HookSelector
          selected={this.state.hookConfiguration}
          onChange={(hookConfiguration) => this.setState({ hookConfiguration })}
        />
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

            this.props.onDispatch(activeEvent, response, {
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

  updateValue(event: ChangeEvent<HTMLTextAreaElement | HTMLSelectElement>) {
    this.setState({ editedData: event.currentTarget.value });
  }
}

interface InterceptorModalProps {
  visible: boolean;
  onDispatch: DispatchSubmitHandler;
  queue: EventQueue;
  hooks: ActiveHooks;
  onHookRemove: (uuid: string) => void;
}

class InterceptorModal extends React.Component<
  InterceptorModalProps,
  InterceptorModalState
> {
  render() {
    return (
      <fieldset
        style={{
          ...InterceptorModalStyles,
          ...(!this.props.visible ? DisabledStyle : {}),
        }}
        disabled={!this.props.visible}
      >
        <h1>Interceptor</h1>
        {this.props.hooks.length > 0 && (
          <HookModal
            hooks={this.props.hooks}
            onRemove={this.props.onHookRemove}
          />
        )}
        {this.props.queue.length > 0 && <DispatchModal {...this.props} />}
      </fieldset>
    );
  }
}

// https://stackoverflow.com/a/2117523
function render(
  domId: string,
  queue: EventQueue,
  hooks: ActiveHooks,
  respond: DispatchSubmitHandler,
  onHookRemove: (uuid: string) => void
) {
  if (queue.length === 0 && hooks.length === 0) {
    unmount(domId);
    return;
  }

  return ReactDOM.render(
    <React.StrictMode>
      <InterceptorModal
        hooks={hooks}
        queue={queue}
        visible={true}
        onDispatch={respond}
        onHookRemove={onHookRemove}
      />
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
  const hooks: ActiveHooks = [];

  const onHookRemove = (uuid: string, skipRender: boolean = false) => {
    const removeIndex = hooks.findIndex(
      (hook) => hook.interceptorUuid === uuid
    );
    console.info(`Remove hook ${uuid} -> ${removeIndex}`);
    // Default submit will set hook as "suspend", i.e. no change
    if (removeIndex >= 0) {
      hooks.splice(removeIndex, 1);
    }

    if (!skipRender) {
      render(domId, queue, hooks, respond, onHookRemove);
    }
  };

  const respond: DispatchSubmitHandler = (
    eventToRemove,
    event,
    hookConfiguration
  ) => {
    const [dispatched] = queue.splice(eventToRemove, 1);

    if (hookConfiguration.hook === "suspend") {
      onHookRemove(dispatched.interceptorUuid, true);
    } else {
      hooks.push({
        interceptorUuid: dispatched.interceptorUuid,
        hookConfiguration,
      });
    }

    eventBus.dispatch(event);

    unmount(domId);

    if (queue.length > 0 || hooks.length > 0) {
      render(domId, queue, hooks, respond, onHookRemove);
    }
  };

  // In case someone else in the network does the dispatching
  eventBus.onDispatch((event) => {
    const eventToRemove = queue.findIndex(
      (e) => e.invocationUuid === event.invocationUuid
    );
    if (eventToRemove >= 0) {
      queue.splice(eventToRemove, 1);
      if (queue.length > 0) {
        render(domId, queue, hooks, respond, onHookRemove);
      } else {
        unmount(domId);
      }
    }
  });

  eventBus.onCapture((event) => {
    queue.push(event);
    render(domId, queue, hooks, respond, onHookRemove);
  });
}
