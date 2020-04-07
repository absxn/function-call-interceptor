import React from "react";
import "./App.css";
import InterceptorModal, { intercept } from "./InterceptorModal";

interface AppState {
  counterA: number | null;
  counterB: number | null;
}

class App extends React.Component<any, AppState> {
  state = {
    counterA: 0,
    counterB: 0,
  };

  render() {
    const disabledA = this.state.counterA === null;
    const disabledB = this.state.counterB === null;

    return (
      <div className="App">
        <button
          disabled={disabledA}
          onClick={() => {
            const counter = this.state.counterA;
            this.setState(
              {
                counterA: null,
              },
              () => {
                intercept(this.getIncrement)(1).then((increment) => {
                  this.setState({
                    counterA: counter + increment,
                  });
                });
              }
            );
          }}
        >
          (A) Intercept call{disabledA && " (waiting)"}
        </button>
        <button
          disabled={disabledB}
          onClick={() => {
            const counter = this.state.counterB;
            this.setState(
              {
                counterB: null,
              },
              () => {
                intercept(this.getIncrement)(1).then((increment) => {
                  this.setState({
                    counterB: counter + increment,
                  });
                });
              }
            );
          }}
        >
          (B) Intercept call{disabledA && " (waiting)"}
        </button>
      </div>
    );
  }

  getIncrement(increment: number): Promise<number> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(increment), 200);
    });
  }
}

export default App;
