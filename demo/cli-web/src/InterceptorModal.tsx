import React, { ChangeEvent, CSSProperties } from "react";
import ReactDOM from "react-dom";
import {
  CaptureEvent,
  DispatchEvent,
  DispatchOptions,
  InterceptBus,
  Trigger,
} from "@interceptor/lib";

type EventQueue = Array<CaptureEvent>;

type ActiveHooks = Array<{
  uuidMask: RegExp;
  hookConfiguration: HookConfiguration;
  hitCount: number;
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

interface HookSetup {
  uuidMask: RegExp;
  delayMs: number;
  action: HookTypes;
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

interface HookDefinitionState {
  triggerString: string;
  uuidMaskString: string;
  delayString: string;
}

type OnHookAdd = (hookSetup: HookSetup) => void;

type OnHookRemove = (index: number, skipRender?: boolean) => void;

interface HookDefinitionProps {
  onAdd: OnHookAdd;
}

class HookDefinition extends React.Component<
  HookDefinitionProps,
  HookDefinitionState & { isValid: boolean }
> {
  state = {
    triggerString: "suspend",
    uuidMaskString: ".*",
    delayString: "0",
    isValid: true,
  };

  render() {
    return (
      <fieldset>
        <label>
          Trigger
          <select
            onChange={(e) =>
              this.setState(
                {
                  triggerString: e.currentTarget.value,
                  isValid: false,
                },
                this.validate
              )
            }
            value={this.state.triggerString}
          >
            <option value="suspend">Suspend</option>
            <option value="pass-through">Pass-through</option>
          </select>
        </label>
        <label>
          UUID pattern
          <input
            type="text"
            onChange={(e) =>
              this.setState(
                {
                  uuidMaskString: e.currentTarget.value,
                  isValid: false,
                },
                this.validate
              )
            }
            value={this.state.uuidMaskString}
          />
        </label>
        <label>
          Delay
          <input
            type="text"
            onChange={(e) =>
              this.setState(
                {
                  delayString: e.currentTarget.value,
                  isValid: false,
                },
                this.validate
              )
            }
            value={this.state.delayString}
          />
        </label>
        <button
          onClick={() =>
            this.props.onAdd({
              action: this.state.triggerString as HookTypes,
              delayMs: parseInt(this.state.delayString, 0),
              uuidMask: new RegExp(this.state.uuidMaskString),
            })
          }
          disabled={!this.state.isValid}
        >
          Add
        </button>
      </fieldset>
    );
  }

  private validate() {
    function isValidTrigger(trigger: string) {
      const valid: HookTypes[] = ["suspend", "pass-through"];
      return valid.includes(trigger as HookTypes);
    }

    function isValidRegExp(regExpString: string) {
      try {
        new RegExp(regExpString);
        return true;
      } catch (e) {
        return false;
      }
    }

    this.setState({
      isValid:
        !isNaN(parseInt(this.state.delayString, 10)) &&
        isValidRegExp(this.state.uuidMaskString) &&
        isValidTrigger(this.state.triggerString),
    });
  }
}

interface HookModalProps {
  hooks: ActiveHooks;
  onAdd: OnHookAdd;
  onRemove: OnHookRemove;
}

class HookModal extends React.Component<HookModalProps> {
  render() {
    return (
      <>
        <table style={{ width: "100%" }}>
          <tbody>
            {this.props.hooks.map((hook, index) => (
              <tr key={index}>
                <td>{hook.uuidMask.toString()}</td>
                <td>{hook.hookConfiguration.hook}</td>
                <td>{hook.hookConfiguration.delayMs}ms</td>
                <td>{hook.hitCount}</td>
                <td
                  style={{
                    color: "red",
                    textDecoration: "underline",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    this.props.onRemove(index);
                  }}
                >
                  Remove
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <HookDefinition onAdd={this.props.onAdd} />
      </>
    );
  }
}

const EventQueue: React.FC<{
  queue: EventQueue;
  activeEvent: number;
  onClick: (activeEvent: number) => void;
}> = ({ queue, activeEvent, onClick }) => (
  <ol>
    {queue.map((e, index) => {
      const uuidString = `${e.interceptorUuid.split("-")[0]}.${
        e.invocationUuid.split("-")[0]
      }`;
      return (
        <li key={index} style={index === activeEvent ? ActiveEventStyle : {}}>
          <span onClick={() => onClick(index)}>
            uuid({uuidString}
            {") "}
            {e.trigger === Trigger.call ? (
              <code>call({JSON.stringify(e.args)}) =&gt; ?</code>
            ) : (
              <code>
                return({JSON.stringify(e.args)}) =&gt; {JSON.stringify(e.rv)}
              </code>
            )}
          </span>
        </li>
      );
    })}
  </ol>
);

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
  onHookAdd: OnHookAdd;
  onHookRemove: OnHookRemove;
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

// https://stackoverflow.com/a/2117523
function render(
  domId: string,
  visible: boolean,
  queue: EventQueue,
  hooks: ActiveHooks,
  respond: DispatchSubmitHandler,
  onHookAdd: OnHookAdd,
  onHookRemove: OnHookRemove
) {
  if (queue.length === 0 && hooks.length === 0 && visible === false) {
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
        onHookAdd={onHookAdd}
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
  const hooks: ActiveHooks = [
    {
      hookConfiguration: { delayMs: 0, hook: "suspend" },
      uuidMask: /.*/,
      hitCount: 0,
    },
  ];

  // Toggle debugger when not suspended
  let visible = false;

  document.addEventListener(
    "keyup",
    (event) => {
      if (event.code === "Backquote") {
        visible = !visible;
      }

      render(domId, visible, queue, hooks, respond, onHookAdd, onHookRemove);
    },
    false
  );

  const onHookAdd = (hookSetup: HookSetup) => {
    console.log("ADD", hookSetup);
    // Prepend so latest hook will be applied first if it matches the mask
    hooks.unshift({
      uuidMask: hookSetup.uuidMask,
      hitCount: 0,
      hookConfiguration: { hook: hookSetup.action, delayMs: hookSetup.delayMs },
    });

    render(domId, visible, queue, hooks, respond, onHookAdd, onHookRemove);
  };

  const onHookRemove: OnHookRemove = (removeIndex, skipRender = false) => {
    console.info(`Remove hook ${removeIndex}`);
    // Default submit will set hook as "suspend", i.e. no change
    if (removeIndex >= 0) {
      hooks.splice(removeIndex, 1);
    }

    if (!skipRender) {
      render(domId, visible, queue, hooks, respond, onHookAdd, onHookRemove);
    }
  };

  const respond: DispatchSubmitHandler = (
    eventToRemove,
    event,
    hookConfiguration
  ) => {
    const [dispatched] = queue.splice(eventToRemove, 1);

    // TODO: Figure out if we want to be able to "single trigger" hooks
    //   if (hookConfiguration.hook === "suspend") {
    //   onHookRemove(0, true);
    // } else {
    //   hooks.push({
    //     uuidMask: new RegExp(dispatched.interceptorUuid),
    //     hookConfiguration,
    //     hitCount: 0,
    //   });
    // }

    eventBus.dispatch(event);

    unmount(domId);

    if (queue.length > 0 || hooks.length > 0 || visible) {
      render(domId, visible, queue, hooks, respond, onHookAdd, onHookRemove);
    }
  };

  // In case someone else in the network does the dispatching
  eventBus.onDispatch((event) => {
    const eventToRemove = queue.findIndex(
      (e) => e.invocationUuid === event.invocationUuid
    );
    if (eventToRemove >= 0) {
      queue.splice(eventToRemove, 1);
      if (queue.length > 0 || visible) {
        render(domId, visible, queue, hooks, respond, onHookAdd, onHookRemove);
      } else {
        unmount(domId);
      }
    }
  });

  eventBus.onCapture((event) => {
    const hookIndex = hooks.findIndex((hook) =>
      hook.uuidMask.test(event.interceptorUuid)
    );
    if (hookIndex > -1) {
      const hook = hooks[hookIndex];
      const delayMs = hook.hookConfiguration.delayMs;
      const hookType = hook.hookConfiguration.hook;

      console.info(
        `Triggering ${hookType} hook (#${hook.hitCount}) for "${
          hook.uuidMask
        }"${delayMs > 0 ? ` delay ${delayMs}ms` : ""}`
      );

      if (hookType === "pass-through") {
        hook.hitCount++;
        setTimeout(() => {
          eventBus.dispatch({
            ...event,
            direction: "dispatch",
            sourceUuid: [],
          });
        }, delayMs);
      } else if (hookType === "suspend") {
        queue.push(event);
      } else {
        `Ignoring unsupported ${hookType} hook for "${hook.uuidMask}"`;
      }

      render(domId, visible, queue, hooks, respond, onHookAdd, onHookRemove);
    } else {
      console.info("Ignoring event, not matching a hook");
    }
  });
}
