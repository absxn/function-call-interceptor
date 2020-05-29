import React from "react";
import "./App.css";
import { intercept } from "./interceptor";
import classNames from "classnames";
import { browserEventBus } from "./InterceptorModal";

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
  onClick: (callback: (...value: A[]) => Promise<T>, value: T) => Promise<T>;
  callback: (...value: A[]) => Promise<T>;
  value: T;
}

interface DemoState<T> {
  value: T;
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
      return new Promise<T>((resolve) => {
        this.setState(
          {
            calling: true,
          },
          async () => {
            const value = await this.props.callback(...args);
            this.setState(
              {
                calling: false,
                callCount: this.state.callCount + 1,
              },
              () => {
                resolve(value);
              }
            );
          }
        );
      });
    };

    return (
      <>
        <div className="counter">{this.state.value}</div>
        <Button
          onClick={() => this.props.onClick(cb, this.state.value)}
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

class App extends React.Component<any, AppState> {
  render() {
    return (
      <div className="App">
        <h1>Interceptor</h1>
        <h2>Single argument demo</h2>
        <div className="demo">
          <h3>Output</h3>
          <h3>Trigger</h3>
          <h3>Job</h3>
          <Demo
            value={0}
            callback={this.square}
            onClick={async (cb, value) => value + (await cb(1))}
          >
            square(1) => 1
          </Demo>
          <Demo
            value={0}
            callback={this.square}
            onClick={async (cb, value) =>
              value + (await intercept(browserEventBus, cb, "call")(1))
            }
          >
            square(INTERCEPT(1)) => 1
          </Demo>
          <Demo
            value={0}
            callback={this.square}
            onClick={async (cb, value) =>
              value + (await intercept(browserEventBus, cb, "return")(2))
            }
          >
            square(2) => INTERCEPT(4)
          </Demo>
          <Demo
            value={0}
            callback={this.square}
            onClick={async (cb, value) =>
              value + (await intercept(browserEventBus, cb, "both")(3))
            }
          >
            square(INTERCEPT(3)) => INTERCEPT(9)
          </Demo>
          <Demo
            value={0}
            callback={this.square}
            onClick={async (cb, value) =>
              value + (await intercept(browserEventBus, cb, "bypass")(4))
            }
          >
            INTERCEPT(square(4)) => ???
          </Demo>
        </div>
        <h2>Multiple arguments</h2>
        <div className="demo">
          <h3>Output</h3>
          <h3>Trigger</h3>
          <h3>Job</h3>
          <Demo
            callback={this.concat}
            value={""}
            onClick={(cb, value) => cb(value, "x", "y")}
          >
            concat("", "x", "y") => "xy"
          </Demo>
          <Demo
            callback={this.concat}
            value={""}
            onClick={(cb, value) =>
              intercept(browserEventBus, cb, "call")(value, "x", "y")
            }
          >
            concat(INTERCEPT("", "x", "y")) => "xy"
          </Demo>
        </div>
        <h2>API call</h2>
        <div className="demo">
          <h3>Output</h3>
          <h3>Trigger</h3>
          <h3>Job</h3>
          <Demo
            callback={this.apiSum("call")}
            value={0}
            onClick={async (cb, value) => value + (await cb(1, 2, 3))}
          >
            fetch("/sum", INTERCEPT([1,2,3])) => 6
          </Demo>
          <Demo
            callback={this.apiSum("return")}
            value={0}
            onClick={async (cb, value) => value + (await cb(1, 2, 3))}
          >
            fetch("/sum", [1,2,3]) => INTERCEPT(6)
          </Demo>
          <Demo
            callback={this.apiSum("both")}
            value={0}
            onClick={async (cb, value) => value + (await cb(1, 2, 3))}
          >
            fetch("/sum", INTERCEPT([1,2,3])) => INTERCEPT(6)
          </Demo>
          <Demo
            callback={this.apiSum("bypass")}
            value={0}
            onClick={async (cb, value) => value + (await cb(1, 2, 3))}
          >
            fetch("/sum", INTERCEPT([1,2,3])) => ???
          </Demo>
        </div>
      </div>
    );
  }

  apiSum(path: "call" | "return" | "both" | "bypass") {
    return (...numbers: number[]): Promise<number> => {
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
        .then((body: { sum: number }) => body.sum);
    };
  }

  square(value: number): Promise<number> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(value * value), 500);
    });
  }

  concat(base: string, ...strings: string[]): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => resolve([base].concat(strings).join("")), 500);
    });
  }
}

export default App;
