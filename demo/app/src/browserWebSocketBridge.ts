import { InterceptBus, InterceptEvent } from "./types";

export function browserWebSocketBridge(bridgeUrl: string, bus: InterceptBus) {
  const socket = new WebSocket(bridgeUrl);

  socket.onopen = function (event) {
    console.info("WebSocket onopen()", event);

    bus.onDispatch((event) => {
      console.log("Websocket.send", event);
      const data = JSON.stringify(event);

      console.info("WebSocket.send()", data);
      this.send(data);
    });
  };

  socket.onclose = function (event) {
    console.info("WebSocket onclose()");
  };

  socket.addEventListener("message", (message) => {
    console.log("WebSocket.message", message.data);
    const event: InterceptEvent = JSON.parse(message.data);
    console.log("  Parsed", event);
    if (event.direction === "capture") {
      bus.capture(event);
    } else if (event.direction === "dispatch") {
      bus.dispatch(event);
    } else {
      console.error("Unexpected direction", message.data);
    }
  });
}
