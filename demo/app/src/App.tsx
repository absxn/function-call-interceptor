import React from "react";
import "./App.css";
import InterceptorModal from "./InterceptorModal";

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
        <InterceptorModal visible={disabled} />
        <button
          disabled={disabled}
          onClick={() => {
            const counter = this.state.counterA;
            this.setState(
              {
                counterA: null,
              },
              () => {
                this.getIncrement().then((increment) => {
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

  getIncrement(): Promise<number> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(1), 200);
    });
  }
}

export default App;
