import React, { ChangeEvent } from "react";
import cx from "classnames";
import "./InterceptorModal.css";
import ReactDOM from "react-dom";
import {
  BypassEvent,
  CallEvent,
  EventBus,
  EventBusEvent,
  InterceptEvent,
  ReturnEvent,
} from "./interceptor";
import { eventBus } from "./eventBus";

type EventQueue = Array<EventBusEvent<InterceptEvent>>;

interface InterceptorModalProps {
  visible: boolean;
  onResponse: (
    eventToRemove: number,
    event: EventBusEvent<InterceptEvent>
  ) => void;
  queue: EventQueue;
}

interface InterceptorModalState {
  activeEvent: number | -1;
  editedData: string;
}

function loadData(
  queue: EventBusEvent<InterceptEvent>[],
  index: number
): string {
  const detail = queue[index].detail;
  return JSON.stringify(detail.trigger === "call" ? detail.args : detail.rv);
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
          {queue.map((e, index) => (
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
                {e.detail.trigger === "call" ? (
                  <code>call({JSON.stringify(e.detail.args)}) => ?</code>
                ) : (
                  <code>
                    return({JSON.stringify(e.detail.args)}) =>{" "}
                    {JSON.stringify(e.detail.rv)}
                  </code>
                )}
              </span>
            </li>
          ))}
        </ol>
        {interceptEvent.detail.trigger === "call" ? (
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
            <pre>function({JSON.stringify(interceptEvent.detail.args)}) =></pre>
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
              interceptEvent.detail.trigger === "call"
                ? new CustomEvent<CallEvent>("response", {
                    detail: {
                      ...interceptEvent.detail,
                      args: JSON.parse(editedData),
                    },
                  })
                : new CustomEvent<ReturnEvent | BypassEvent>("response", {
                    detail: {
                      ...interceptEvent.detail,
                      rv: JSON.parse(editedData),
                    },
                  });

            this.props.onResponse(activeEvent, response);
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

const socket = new WebSocket("ws://localhost:3001/ws");

socket.onopen = function (event) {
  console.info("WebSocket onopen()", event);

  eventBus.addEventListener("response", (event) => {
    console.log("Websocket.send", event);
    const data = JSON.stringify({ type: "response", detail: event.detail });

    console.info("WebSocket.send()", data);
    this.send(data);
  });
};

socket.onclose = function (event) {
  console.info("WebSocket onclose()");
};

socket.addEventListener("message", (event) => {
  console.log("WebSocket.message", event.data);
  const json = JSON.parse(event.data);
  console.log("  Parsed", json);
  eventBus.dispatchEvent(json);
});

// https://stackoverflow.com/a/2117523
function render(
  domId: string,
  queue: EventQueue,
  respond: (eventToRemove: number, event: EventBusEvent<InterceptEvent>) => void
) {
  return ReactDOM.render(
    <React.StrictMode>
      <InterceptorModal queue={queue} visible={true} onResponse={respond} />
    </React.StrictMode>,
    document.getElementById(domId)
  );
}

export function mountInterceptorClient(domId: string, eventBus: EventBus) {
  const queue: EventQueue = [];

  function respond(
    eventToRemove: number,
    event: EventBusEvent<InterceptEvent>
  ) {
    queue.splice(eventToRemove, 1);

    console.info(`Dispatched`, event);
    eventBus.dispatchEvent(event);

    const elementById = document.getElementById(domId);
    if (elementById === null) {
      throw new Error(`Can't find interceptor root element with #${domId}`);
    } else {
      ReactDOM.unmountComponentAtNode(elementById);
    }

    if (queue.length > 0) {
      render(domId, queue, respond);
    }
  }

  eventBus.addEventListener("call", function requestListener(
    event: EventBusEvent<CallEvent>
  ) {
    queue.push(event);
    render(domId, queue, respond);
  });
}
