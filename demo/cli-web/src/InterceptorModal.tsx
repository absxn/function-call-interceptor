import React, { ChangeEvent } from "react";
import cx from "classnames";
// import "./InterceptorModal.css";
import ReactDOM from "react-dom";
import { InterceptBus, InterceptEvent, Trigger } from "@interceptor/lib";

type EventQueue = Array<InterceptEvent>;

interface InterceptorModalProps {
  visible: boolean;
  onDispatch: (eventToRemove: number, event: InterceptEvent) => void;
  queue: EventQueue;
}

interface InterceptorModalState {
  activeEvent: number | -1;
  editedData: string;
}

function loadData(queue: InterceptEvent[], index: number): string {
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
    return (
      <fieldset
        className={cx("interceptorModal", { disabled: !this.props.visible })}
        disabled={!this.props.visible}
      >
        <h1>Intercepted</h1>
        <h2>Queue</h2>
        <ol className="eventSelector">
          {queue.map((e, index) => {
            const uuidString = `${e.interceptorUuid.split("-")[0]}.${
              e.invocationUuid.split("-")[0]
            }`;
            return (
              <li
                key={index}
                className={cx({ activeEvent: index === activeEvent })}
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
                    <code>call({JSON.stringify(e.args)}) => ?</code>
                  ) : (
                    <code>
                      return({JSON.stringify(e.args)}) => {JSON.stringify(e.rv)}
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
            <pre>function(</pre>
            <textarea
              className={cx("editor", { invalidJson: !validInput })}
              onChange={this.updateValue.bind(this)}
              value={this.state.editedData}
            />
            <pre>) => ?</pre>
          </>
        ) : (
          <>
            <h2>Return value</h2>
            <pre>function({JSON.stringify(interceptEvent.args)}) =></pre>
            <textarea
              className={cx("editor", { invalidJson: !validInput })}
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
          disabled={!validInput}
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
        </button>
      </fieldset>
    );
  }

  updateValue(event: ChangeEvent<HTMLTextAreaElement>) {
    this.setState({ editedData: event.currentTarget.value });
  }
}

// https://stackoverflow.com/a/2117523
function render(
  domId: string,
  queue: EventQueue,
  respond: (eventToRemove: number, event: InterceptEvent) => void
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

  function respond(eventToRemove: number, event: InterceptEvent) {
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
