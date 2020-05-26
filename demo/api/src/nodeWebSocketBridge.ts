import { CallEvent, EventBus, EventBusEvent } from "../../app/src/interceptor";
import { WebsocketRequestHandler } from "express-ws";

export function nodeWebSocketBridge(bus: EventBus): WebsocketRequestHandler {
  return function (ws, _req) {
    console.log("/ws");
    const eventListener = function requestListener(
      event: EventBusEvent<CallEvent>
    ) {
      console.log("requestListener", event);
      console.log("type", typeof event);
      ws.send(JSON.stringify(event));
    };
    bus.addEventListener("call", eventListener);

    ws.on("message", function (msg) {
      console.info("WebSocket message", arguments);
      bus.dispatchEvent(JSON.parse(msg as string));
    });

    ws.on("close", function () {
      console.info("WebSocket close", arguments);
      bus.removeEventListener("call", eventListener);
    });
  };
}
