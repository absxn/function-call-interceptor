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
          <div className="counter">{this.state.counterN}</div>
          <Button
            onClick={() => this.square(1)}
            onChange={(value) => {
              this.setState({ counterN: this.state.counterN + value });
            }}
          >
            += await square(1) => 1
          </Button>
          <div className="counter">{this.state.counterA}</div>
          <Button
            onClick={() => intercept(this.square, "call")(1)}
            onChange={(value) => {
              this.setState({ counterA: this.state.counterA + value });
            }}
          >
            += await square(INTERCEPT(1)) => 1
          </Button>
          <div className="counter">{this.state.counterB}</div>
          <Button
            onClick={() => intercept(this.square, "return")(2)}
            onChange={(value) => {
              this.setState({ counterB: this.state.counterB + value });
            }}
          >
            += await square(2) => INTERCEPT(4)
          </Button>
          <div className="counter">{this.state.counterC}</div>
          <Button
            onClick={() => intercept(this.square, "both")(3)}
            onChange={(value) => {
              this.setState({ counterC: this.state.counterC + value });
            }}
          >
            += await square(INTERCEPT(3)) => INTERCEPT(9)
          </Button>
          <div className="counter">{this.state.counterD}</div>
          <Button
            onClick={() => intercept(this.square, "bypass")(4)}
            onChange={(value) => {
              this.setState({ counterD: this.state.counterD + value });
            }}
          >
            += await INTERCEPT(square(4)) => ???
          </Button>
        </div>
        <h2>Multiple arguments</h2>
        <div className="demo">
          <div className="counter">{this.state.stringA}</div>
          <Button
            onClick={() => this.concat(this.state.stringA, "x", "y")}
            onChange={(value) => {
              this.setState({ stringA: value });
            }}
          >
            = await concat("{this.state.stringA}", "x", "y") => "
            {this.state.stringA}xy"
          </Button>
          <div className="counter">{this.state.stringB}</div>
          <Button
            onClick={() =>
              intercept(this.concat, "call")(this.state.stringB, "x", "y")
            }
            onChange={(value) => {
              this.setState({ stringB: value });
            }}
          >
            = aw= await concat(INTERCEPT("{this.state.stringB}", "x", "y")) => "
            {this.state.stringB}xy"
          </Button>
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
