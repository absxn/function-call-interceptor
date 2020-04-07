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
    const disabled = this.state.counterA === null;

    return (
      <div className="App">
        <button
          disabled={disabled}
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
          Intercept call{disabled && " (waiting)"}
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
