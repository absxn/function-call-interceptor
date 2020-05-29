import { InterceptBus } from "./types";

export function browserWebSocketBridge(bridgeUrl: string, bus: InterceptBus) {
  const socket = new WebSocket(bridgeUrl);

  socket.onopen = function (event) {
    console.info("WebSocket onopen()", event);

    bus.onDispatch((event) => {
      console.log("Websocket.send", event);
      const data = JSON.stringify({ direction: "dispatch", event });

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
    if (json.direction === "capture") {
      bus.capture(json.event);
    } else if (json.direction === "dispatch") {
      bus.dispatch(json.event);
    } else {
      console.error("Unexpected direction", event.data);
    }
  });
}
