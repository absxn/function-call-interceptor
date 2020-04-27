import React from "react";
import "./App.css";
import { intercept } from "./InterceptorModal";

interface Counter {
  pending: boolean;
  value: number;
}

interface ConcatenatedString {
  pending: boolean;
  value: string;
}

interface AppState {
  counterN: Counter;
  counterA: Counter;
  counterB: Counter;
  counterC: Counter;
  stringA: ConcatenatedString;
  stringB: ConcatenatedString;
}

class App extends React.Component<any, AppState> {
  state = {
    counterN: { pending: false, value: 0 },
    counterA: { pending: false, value: 0 },
    counterB: { pending: false, value: 0 },
    counterC: { pending: false, value: 0 },
    stringA: { pending: false, value: "" },
    stringB: { pending: false, value: "" },
  };

  render() {
    const disabledN = this.state.counterN.pending;
    const disabledA = this.state.counterA.pending;
    const disabledB = this.state.counterB.pending;
    const disabledC = this.state.counterC.pending;
    const disabledStringA = this.state.stringA.pending;
    const disabledStringB = this.state.stringB.pending;

    return (
      <div className="App">
        <h1>Interceptor</h1>
        <h2>Single argument demo</h2>
        <div className="demo">
          <div className="counter">{this.state.counterN.value}</div>
          <button
            disabled={disabledN}
            onClick={() => {
              this.setState(
                {
                  counterN: { ...this.state.counterN, pending: true },
                },
                () => {
                  this.square(1).then((increment) => {
                    this.setState({
                      counterN: {
                        pending: false,
                        value: this.state.counterN.value + increment,
                      },
                    });
                  });
                }
              );
            }}
          >
            += await square(1) => 1{disabledN && " (waiting)"}
          </button>
          <div className="counter">{this.state.counterA.value}</div>
          <button
            disabled={disabledA}
            onClick={() => {
              this.setState(
                {
                  counterA: { ...this.state.counterA, pending: true },
                },
                () => {
                  intercept(
                    this.square,
                    "call"
                  )(1).then((increment) => {
                    this.setState({
                      counterA: {
                        pending: false,
                        value: this.state.counterA.value + increment,
                      },
                    });
                  });
                }
              );
            }}
          >
            += await square(INTERCEPT(1)) => 1{disabledA && " (waiting)"}
          </button>
          <div className="counter">{this.state.counterB.value}</div>
          <button
            disabled={disabledB}
            onClick={() => {
              this.setState(
                {
                  counterB: { ...this.state.counterB, pending: true },
                },
                () => {
                  intercept(
                    this.square,
                    "return"
                  )(2).then((increment) => {
                    this.setState({
                      counterB: {
                        pending: false,
                        value: this.state.counterB.value + increment,
                      },
                    });
                  });
                }
              );
            }}
          >
            += await square(2) => INTERCEPT(4){disabledB && " (waiting)"}
          </button>
          <div className="counter">{this.state.counterC.value}</div>
          <button
            disabled={disabledC}
            onClick={() => {
              this.setState(
                {
                  counterC: { ...this.state.counterC, pending: true },
                },
                () => {
                  intercept(
                    this.square,
                    "both"
                  )(3).then((increment) => {
                    this.setState({
                      counterC: {
                        pending: false,
                        value: this.state.counterC.value + increment,
                      },
                    });
                  });
                }
              );
            }}
          >
            += await square(INTERCEPT(3)) => INTERCEPT(9)
            {disabledC && " (waiting)"}
          </button>
        </div>
        <h2>Multiple arguments</h2>
        <div className="demo">
          <div className="counter">{this.state.stringA.value}</div>
          <button
            disabled={disabledStringA}
            onClick={() => {
              this.setState(
                {
                  stringA: { ...this.state.stringA, pending: true },
                },
                () => {
                  this.concat(this.state.stringA.value, "x", "y").then(
                    (newString) => {
                      this.setState({
                        stringA: {
                          pending: false,
                          value: newString,
                        },
                      });
                    }
                  );
                }
              );
            }}
          >
            += await concat("x", "y") => "xy"{disabledStringA && " (waiting)"}
          </button>
          <div className="counter">{this.state.stringB.value}</div>
          <button
            disabled={disabledStringB}
            onClick={() => {
              this.setState(
                {
                  stringB: { ...this.state.stringB, pending: true },
                },
                () => {
                  intercept(this.concat, "call")(
                    this.state.stringB.value,
                    "x",
                    "y"
                  ).then((newString) => {
                    this.setState({
                      stringB: {
                        pending: false,
                        value: newString,
                      },
                    });
                  });
                }
              );
            }}
          >
            += await concat(INTERCEPT("x", "y")) => "x"
            {disabledStringB && " (waiting)"}
          </button>
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
