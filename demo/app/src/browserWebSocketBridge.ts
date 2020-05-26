import { EventBus } from "./interceptor";

export function browserWebSocketBridge(bus: EventBus) {
  const socket = new WebSocket("ws://localhost:3001/ws");

  socket.onopen = function (event) {
    console.info("WebSocket onopen()", event);

    bus.addEventListener("response", (event) => {
      console.log("Websocket.send", event);
      const data = JSON.stringify({ type: "response", detail: event.detail });

      console.info("WebSocket.send()", data);
      this.send(data);
    });
  };

  socket.onclose = function (event) {
    console.info("WebSocket onclose()");
  };

  socket.addEventListener("message", (event) => {
    console.log("WebSocket.message", event.data);
    const json = JSON.parse(event.data);
    console.log("  Parsed", json);
    bus.dispatchEvent(json);
  });
}
