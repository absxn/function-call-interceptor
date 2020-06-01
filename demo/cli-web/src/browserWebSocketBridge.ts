import { InterceptBus } from "@interceptor/lib";

export function browserWebSocketBridge(bridgeUrl: string, bus: InterceptBus) {
  console.info("WebSocket create");
  const socket = new WebSocket(bridgeUrl);

  socket.onopen = function (event) {
    console.info("WebSocket onopen()", event);

    bus.onEvent((event) => {
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
    bus.event(JSON.parse(message.data));
  });
}
