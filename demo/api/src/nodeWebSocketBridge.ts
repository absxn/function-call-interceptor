import { InterceptBus, InterceptHandler } from "@interceptor/lib";
import { WebsocketRequestHandler } from "express-ws";

export function nodeWebSocketBridge(
  bus: InterceptBus
): WebsocketRequestHandler {
  return function (ws, _req) {
    const eventListener: InterceptHandler = (event) => {
      const data = JSON.stringify(event);
      console.info("WebSocket send", data);
      ws.send(data);
    };
    const removeListener = bus.onEvent(eventListener);

    ws.on("open", () => {
      console.info("WebSocket open");
    });

    ws.on("message", function (msg) {
      console.info("WebSocket message", arguments);
      bus.event(JSON.parse(msg as string));
    });

    ws.on("close", function () {
      console.info("WebSocket close", arguments);
      removeListener();
    });
  };
}
