import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App, { eventBus } from "./App";
import * as serviceWorker from "./serviceWorker";
import { mountInterceptorClient } from "./InterceptorModal";

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root")
);

mountInterceptorClient("interceptor", eventBus);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
