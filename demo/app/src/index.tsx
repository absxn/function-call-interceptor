import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import * as serviceWorker from "./serviceWorker";
import {
  browserWebSocketBridge,
  mountInterceptorClient,
} from "@interceptor/cli-web";
import { EventBus, intercept, Trigger } from "@interceptor/lib";
import classNames from "classnames";

type DemoResponse<T> =
  | { success: true; value: T }
  | { success: false; message: string };

interface AppState {}

interface ButtonState {
  disabled: boolean;
}

interface ButtonProps<T> {
  onChange: (value: T) => void;
  onClick: () => Promise<T>;
}

class Button<T> extends React.Component<ButtonProps<T>, ButtonState> {
  state = {
    disabled: false,
  };

  render() {
    return (
      <button
        disabled={this.state.disabled}
        onClick={() => {
          this.setState(
            {
              disabled: true,
            },
            () => {
              this.props.onClick().then((value) => {
                this.setState(
                  {
                    disabled: false,
                  },
                  () => {
                    this.props.onChange(value);
                  }
                );
              });
            }
          );
        }}
      >
        {this.props.children}
        {this.state.disabled && " (waiting)"}
      </button>
    );
  }
}

interface DemoProps<T, A extends any> {
  value: DemoResponse<T>;
  onClick: (
    callback: (...value: A[]) => Promise<DemoResponse<T>>
  ) => Promise<DemoResponse<T>>;
  callback: (...value: A[]) => Promise<DemoResponse<T>>;
}

interface DemoState<T> {
  value: DemoResponse<T | null>;
  calling: boolean;
  callCount: number;
}

class Demo<T, A> extends React.Component<DemoProps<T, A>, DemoState<T>> {
  state = {
    value: this.props.value,
    calling: false,
    callCount: 0,
  };

  render() {
    const cb = (...args: A[]) => {
      return new Promise<DemoResponse<T>>((resolve) => {
        this.setState(
          {
            calling: true,
          },
          async () => {
            resolve(await this.props.callback(...args));
          }
        );
      });
    };

    const value = this.state.value;
    return (
      <>
        <div className={classNames("counter", { error: !value.success })}>
          {value.success === true ? value.value : `ERROR: ${value.message}`}
        </div>
        <Button
          onClick={async () => {
            const result = await this.props.onClick(cb);
            this.setState({
              calling: false,
              callCount: this.state.callCount + 1,
            });
            return result;
          }}
          onChange={(value) => {
            this.setState({ value });
          }}
        >
          {this.props.children}
        </Button>
        <div className={classNames("status", { active: this.state.calling })}>
          {this.state.calling
            ? "Running"
            : `Called ${this.state.callCount} times`}
        </div>
      </>
    );
  }
}

interface AppProps {
  bus: EventBus;
}

class App extends React.Component<AppProps, AppState> {
  render() {
    const browserEventBus = this.props.bus;

    return (
      <div className="App">
        <h1>Interceptor</h1>
        <h2>Single argument demo</h2>
        <div className="demo">
          <h3>Output</h3>
          <h3>Trigger</h3>
          <h3>Job</h3>
          <Demo
            value={{ success: true, value: 0 }}
            callback={this.square}
            onClick={(cb) => cb(1)}
          >
            square(1) =&gt; 1
          </Demo>
          <Demo
            value={{ success: true, value: 0 }}
            callback={this.square}
            onClick={async (cb) =>
              await intercept(browserEventBus, cb, {
                trigger: Trigger.call,
                uuid: "square",
                dispatchOptionsArguments: [[9, 8, 7]],
                dispatchOptionOverride: false,
              })(1)
            }
          >
            square(INTERCEPT(1)) =&gt; 1
          </Demo>
          <Demo
            value={{ success: true, value: 0 }}
            callback={this.square}
            onClick={async (cb) =>
              await intercept(browserEventBus, cb, {
                trigger: Trigger.return,
              })(2)
            }
          >
            square(2) =&gt; INTERCEPT(4)
          </Demo>
          <Demo
            value={{ success: true, value: 0 }}
            callback={this.square}
            onClick={async (cb) =>
              await intercept(browserEventBus, cb, { trigger: Trigger.both })(3)
            }
          >
            square(INTERCEPT(3)) =&gt; INTERCEPT(9)
          </Demo>
          <Demo
            value={{ success: true, value: 0 }}
            callback={this.square}
            onClick={async (cb) =>
              await intercept(browserEventBus, cb, {
                trigger: Trigger.bypass,
              })(4)
            }
          >
            INTERCEPT(square(4)) =&gt; ???
          </Demo>
        </div>
        <h2>Multiple arguments</h2>
        <div className="demo">
          <h3>Output</h3>
          <h3>Trigger</h3>
          <h3>Job</h3>
          <Demo
            value={{ success: true, value: "" }}
            callback={this.concat}
            onClick={(cb) => cb("x", "y")}
          >
            concat("", "x", "y") =&gt; "xy"
          </Demo>
          <Demo
            value={{ success: true, value: "" }}
            callback={this.concat}
            onClick={(cb) =>
              intercept(browserEventBus, cb, { trigger: Trigger.call })(
                "x",
                "y"
              )
            }
          >
            concat(INTERCEPT("", "x", "y")) =&gt; "xy"
          </Demo>
        </div>
        <h2>API call</h2>
        <div className="demo">
          <h3>Output</h3>
          <h3>Trigger</h3>
          <h3>Job</h3>
          <Demo
            value={{ success: true, value: 0 }}
            callback={this.apiSum("call")}
            onClick={async (cb) => await cb(1, 2, 3)}
          >
            fetch("/sum", INTERCEPT([1,2,3])) =&gt; 6
          </Demo>
          <Demo
            value={{ success: true, value: 0 }}
            callback={this.apiSum("return")}
            onClick={async (cb) => await cb(1, 2, 3)}
          >
            fetch("/sum", [1,2,3]) =&gt; INTERCEPT(6)
          </Demo>
          <Demo
            value={{ success: true, value: 0 }}
            callback={this.apiSum("both")}
            onClick={async (cb) => await cb(1, 2, 3)}
          >
            fetch("/sum", INTERCEPT([1,2,3])) =&gt; INTERCEPT(6)
          </Demo>
          <Demo
            value={{ success: true, value: 0 }}
            callback={this.apiSum("bypass")}
            onClick={async (cb) => await cb(1, 2, 3)}
          >
            fetch("/sum", INTERCEPT([1,2,3])) =&gt; ???
          </Demo>
        </div>
      </div>
    );
  }

  apiSum(path: "call" | "return" | "both" | "bypass") {
    return (...numbers: number[]): Promise<DemoResponse<number>> => {
      return fetch(`http://localhost:3001/interceptor-demo/${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ numbers }),
      })
        .then((response: any) => {
          return response.json();
        })
        .then((body: { sum: number }) => ({ success: true, value: body.sum }));
    };
  }

  square(value: number): Promise<DemoResponse<number>> {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ success: true, value: value * value }), 500);
    });
  }

  concat(base: string, ...strings: string[]): Promise<DemoResponse<string>> {
    return new Promise((resolve) => {
      setTimeout(
        () =>
          resolve({ success: true, value: [base].concat(strings).join("") }),
        500
      );
    });
  }
}

const browserEventBus = new EventBus({ uuid: "app" });

browserWebSocketBridge("ws://localhost:3001/ws", browserEventBus);

ReactDOM.render(
  <React.StrictMode>
    <App bus={browserEventBus} />
  </React.StrictMode>,
  document.getElementById("root")
);

mountInterceptorClient("interceptor", browserEventBus);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
