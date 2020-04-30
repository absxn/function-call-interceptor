import React from "react";
import "./App.css";
import { intercept } from "./InterceptorModal";

interface AppState {
  counterN: number;
  counterA: number;
  counterB: number;
  counterC: number;
  counterD: number;
  stringA: string;
  stringB: string;
}

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

interface DemoProps<T> {
  onClick: (value: T) => Promise<T>;
  value: T;
}

interface DemoState<T> {
  value: T;
}

class Demo<T> extends React.Component<DemoProps<T>, DemoState<T>> {
  state = {
    value: this.props.value,
  };

  render() {
    return (
      <>
        <div className="counter">{this.state.value}</div>
        <Button
          onClick={() => this.props.onClick(this.state.value)}
          onChange={(value) => {
            this.setState({ value });
          }}
        >
          {this.props.children}
        </Button>
      </>
    );
  }
}

class App extends React.Component<any, AppState> {
  state = {
    counterN: 0,
    counterA: 0,
    counterB: 0,
    counterC: 0,
    counterD: 0,
    stringA: "",
    stringB: "",
  };

  render() {
    return (
      <div className="App">
        <h1>Interceptor</h1>
        <h2>Single argument demo</h2>
        <div className="demo">
          <Demo value={0} onClick={() => this.square(1)}>
            += await square(1) => 1
          </Demo>
          <Demo
            value={0}
            onClick={async (value) =>
              value + (await intercept(this.square, "call")(1))
            }
          >
            += await square(INTERCEPT(1)) => 1
          </Demo>
          <Demo
            value={0}
            onClick={async (value) =>
              value + (await intercept(this.square, "return")(2))
            }
          >
            += await square(2) => INTERCEPT(4)
          </Demo>
          <Demo
            value={0}
            onClick={async (value) =>
              value + (await intercept(this.square, "both")(3))
            }
          >
            += await square(INTERCEPT(3)) => INTERCEPT(9)
          </Demo>
          <Demo
            value={0}
            onClick={async (value) =>
              value + (await intercept(this.square, "bypass")(4))
            }
          >
            += await INTERCEPT(square(4)) => ???
          </Demo>
        </div>
        <h2>Multiple arguments</h2>
        <div className="demo">
          <Demo value={""} onClick={(value) => this.concat(value, "x", "y")}>
            = await concat("{this.state.stringA}", "x", "y") => "xy"
          </Demo>
          <Demo
            value={""}
            onClick={(value) => intercept(this.concat, "call")(value, "x", "y")}
          >
            = await concat(INTERCEPT("{this.state.stringB}", "x", "y")) => "xy"
          </Demo>
        </div>
      </div>
    );
  }

  square(value: number): Promise<number> {
    console.info(`App: square(${value})`);
    return new Promise((resolve) => {
      setTimeout(() => resolve(value * value), 500);
    });
  }

  concat(base: string, ...strings: string[]): Promise<string> {
    console.info(`App: concat(${JSON.stringify(strings)})`);
    return new Promise((resolve) => {
      setTimeout(() => resolve([base].concat(strings).join("")), 500);
    });
  }
}

export default App;
