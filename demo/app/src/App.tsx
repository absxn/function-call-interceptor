import React from "react";
import "./App.css";
import InterceptorModal, { intercept } from "./InterceptorModal";

interface AppState {
  counterA: number | null;
  counterB: number | null;
}

interface Incrementer {
  from: string;
  increment: number;
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
                intercept(this.getIncrement, "call")({ from: "A", increment: 1 }).then(
                  (increment: Incrementer) => {
                    this.setState({
                      counterA: counter + increment.increment,
                    });
                  }
                );
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
                intercept(this.getIncrement, "return")({ from: "B", increment: 2 }).then(
                  (increment: Incrementer) => {
                    this.setState({
                      counterB: counter + increment.increment,
                    });
                  }
                );
              }
            );
          }}
        >
          (B) Intercept return{disabledA && " (waiting)"}
        </button>
      </div>
    );
  }

  getIncrement(increment: Incrementer): Promise<Incrementer> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(increment), 200);
    });
  }
}

export default App;
