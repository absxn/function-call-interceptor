import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import * as serviceWorker from "./serviceWorker";
import {
  browserWebSocketBridge,
  mountInterceptorClient,
} from "@interceptor/cli-web";
import { EventBus, Trigger } from "@interceptor/lib";
import classNames from "classnames";

function isValidJsonString(jsonString: string) {
  try {
    JSON.parse(jsonString);
    return true;
  } catch {
    return false;
  }
}

type DemoResponse<T> =
  | { success: true; value: T }
  | { success: false; message: string };

interface AppState {}

interface ButtonState {
  disabled: boolean;
}

interface ButtonProps<T> {
  disabled: boolean;
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
        disabled={this.state.disabled || this.props.disabled}
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
    callback: (...value: A[]) => Promise<DemoResponse<T>>,
    value: A[]
  ) => Promise<DemoResponse<T>>;
  callback: (...value: A[]) => Promise<DemoResponse<T>>;
  defaultInput: A[];
  label: (intput: A[]) => string;
}

interface DemoState<T> {
  output: DemoResponse<T | null>;
  input: string;
  isValidInput: boolean;
  calling: boolean;
  callCount: number;
}

class Demo<T, A> extends React.Component<DemoProps<T, A>, DemoState<T>> {
  constructor(props: DemoProps<T, A>) {
    super(props);

    const input = JSON.stringify(props.defaultInput);
    this.state = {
      input,
      isValidInput: isValidJsonString(input),
      output: props.value,
      calling: false,
      callCount: 0,
    };
  }

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

    const value = this.state.output;
    return (
      <>
        <div>
          <input
            type="text"
            value={this.state.input}
            className={classNames({ error: !this.state.isValidInput })}
            onChange={(e) => {
              const input = e.currentTarget.value;
              this.setState({
                input,
                isValidInput: isValidJsonString(input),
              });
            }}
          />
        </div>
        <Button
          disabled={!this.state.isValidInput}
          onClick={async () => {
            const result = await this.props.onClick(
              cb,
              JSON.parse(this.state.input)
            );
            this.setState({
              calling: false,
              callCount: this.state.callCount + 1,
            });
            return result;
          }}
          onChange={(output) => {
            this.setState({ output });
          }}
        >
          {this.props.label
            ? this.state.isValidInput
              ? this.props.label(JSON.parse(this.state.input))
              : "Broken input"
            : this.props.children}
        </Button>
        <div className={classNames("status", { active: this.state.calling })}>
          {this.state.calling
            ? "Running"
            : `Called ${this.state.callCount} times`}
        </div>
        <div className={classNames("counter", { error: !value.success })}>
          {value.success === true ? value.value : `ERROR: ${value.message}`}
        </div>
      </>
    );
  }
}

interface AppProps {
  bus: EventBus;
}

const Heading = () => (
  <>
    <h3>Input</h3>
    <h3>Trigger</h3>
    <h3>Job</h3>
    <h3>Output</h3>
  </>
);

class App extends React.Component<AppProps, AppState> {
  render() {
    const intercept = this.props.bus.getInterceptor();

    const partialSquare = intercept(this.square, {
      trigger: Trigger.call,
      uuid: "square",
      dispatchOptionsArguments: [
        { value: [2] },
        { label: "Three", value: [3] },
        { value: [4] },
      ],
      dispatchOptionOverride: false,
    });

    return (
      <div className="App">
        <h1>Interceptor</h1>
        <h2>Single argument demo</h2>
        <div className="demo">
          <Heading />
          <Demo
            defaultInput={[1]}
            value={{ success: true, value: 0 }}
            callback={this.square}
            onClick={(cb, value) => cb(...value)}
            label={(input) => `square(INTERCEPT(${input.join(",")})) => number`}
          />
          <Demo
            defaultInput={[1]}
            value={{ success: true, value: 0 }}
            callback={partialSquare}
            onClick={(cb, value) => cb(...value)}
            label={(input) => `square(INTERCEPT(${input.join(",")})) => number`}
          />
          <Demo
            defaultInput={[2]}
            value={{ success: true, value: 0 }}
            callback={this.square}
            onClick={async (cb, value) =>
              await intercept(cb, {
                trigger: Trigger.return,
                dispatchOptionsReturnValue: [
                  {
                    label: "Demo error",
                    value: { success: false, message: "Error" },
                  },
                ],
                dispatchOptionOverride: true,
              })(...value)
            }
            label={(input) => `square(${input.join(",")}) => INTERCEPT(number)`}
          />
          <Demo
            defaultInput={[3]}
            value={{ success: true, value: 0 }}
            callback={this.square}
            onClick={async (cb, value) =>
              await intercept(cb, { trigger: Trigger.both })(...value)
            }
            label={(input) =>
              `square(INTERCEPT(${input.join(",")})) => INTERCEPT(number)`
            }
          />
          <Demo
            defaultInput={[4]}
            value={{ success: true, value: 0 }}
            callback={this.square}
            onClick={async (cb, value) =>
              await intercept(cb, {
                trigger: Trigger.bypass,
              })(...value)
            }
            label={(input) => `square(${input.join(",")}) => number`}
          />
        </div>
        <h2>Multiple arguments</h2>
        <div className="demo">
          <Heading />
          <Demo
            defaultInput={["x", "y"]}
            value={{ success: true, value: "" }}
            callback={this.concat}
            onClick={(cb, value) => cb(...value)}
            label={(input) => `concat(${input.join(",")}) => string`}
          />
          <Demo
            defaultInput={["x", "y"]}
            value={{ success: true, value: "" }}
            callback={this.concat}
            onClick={(cb, value) =>
              intercept(cb, { trigger: Trigger.call })(...value)
            }
            label={(input) => `concat(INTERCEPT(${input.join(",")})) => string`}
          />
        </div>
        <h2>API call</h2>
        <div className="demo">
          <Heading />
          <Demo
            defaultInput={[1, 2, 3]}
            value={{ success: true, value: 0 }}
            callback={this.apiSum("call")}
            onClick={async (cb, value) => await cb(...value)}
            label={(input) =>
              `.post("/sum", sum(INTERCEPT(${input.join(",")})) => number)`
            }
          />

          <Demo
            defaultInput={[1, 2, 3]}
            value={{ success: true, value: 0 }}
            callback={this.apiSum("return")}
            onClick={async (cb, value) => await cb(...value)}
            label={(input) =>
              `.post("/return", sum(${input.join(",")}) => INTERCEPT(number))`
            }
          />
          <Demo
            defaultInput={[1, 2, 3]}
            value={{ success: true, value: 0 }}
            callback={this.apiSum("both")}
            onClick={async (cb, value) => await cb(...value)}
            label={(input) =>
              `.post("/both", sum(INTERCEPT(${input.join(
                ","
              )}) => INTERCEPT(number))`
            }
          />
          <Demo
            defaultInput={[1, 2, 3]}
            value={{ success: true, value: 0 }}
            callback={this.apiSum("bypass")}
            onClick={async (cb, value) => await cb(...value)}
            label={(input) =>
              `.post("/bypass", sum(INTERCEPT(${input.join(",")}) => any)`
            }
          />
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
