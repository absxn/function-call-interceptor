import React from "react";
import "./App.css";
import { intercept } from "./InterceptorModal";

interface Counter {
  pending: boolean;
  value: number;
}

interface AppState {
  counterN: Counter;
  counterA: Counter;
  counterB: Counter;
  counterC: Counter;
}

class App extends React.Component<any, AppState> {
  state = {
    counterN: { pending: false, value: 0 },
    counterA: { pending: false, value: 0 },
    counterB: { pending: false, value: 0 },
    counterC: { pending: false, value: 0 },
  };

  render() {
    const disabledN = this.state.counterN.pending;
    const disabledA = this.state.counterA.pending;
    const disabledB = this.state.counterB.pending;
    const disabledC = this.state.counterC.pending;

    return (
      <div className="App">
        <button
          disabled={disabledN}
          onClick={() => {
            this.setState(
              {
                counterN: { ...this.state.counterN, pending: true },
              },
              () => {
                this.getIncrement(1).then((increment) => {
                  console.info("Button A triggered");
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
          Normal button{disabledN && " (waiting)"}
        </button>
        <div className="counter">{this.state.counterN.value}</div>
        <button
          disabled={disabledA}
          onClick={() => {
            this.setState(
              {
                counterA: { ...this.state.counterA, pending: true },
              },
              () => {
                intercept(
                  this.getIncrement,
                  "call"
                )(1).then((increment) => {
                  console.info("Button A triggered");
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
          (A) Intercept call{disabledA && " (waiting)"}
        </button>
        <div className="counter">{this.state.counterA.value}</div>
        <button
          disabled={disabledB}
          onClick={() => {
            this.setState(
              {
                counterB: { ...this.state.counterB, pending: true },
              },
              () => {
                intercept(
                  this.getIncrement,
                  "return"
                )(2).then((increment) => {
                  console.info("Button B triggered");
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
          (B) Intercept return{disabledB && " (waiting)"}
        </button>
        <div className="counter">{this.state.counterB.value}</div>
        <button
          disabled={disabledC}
          onClick={() => {
            this.setState(
              {
                counterC: { ...this.state.counterC, pending: true },
              },
              () => {
                intercept(
                  this.getIncrement,
                  "both"
                )(3).then((increment) => {
                  console.info("Button C triggered");
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
          (C) Intercept call and return{disabledC && " (waiting)"}
        </button>
        <div className="counter">{this.state.counterC.value}</div>
      </div>
    );
  }

  getIncrement(increment: number): Promise<number> {
    console.info(`App: getIncrement(${increment})`);
    return new Promise((resolve) => {
      setTimeout(() => resolve(increment), 500);
    });
  }
}

export default App;
