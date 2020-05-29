import { EventBus, InterceptEvent } from "../../app/src/types";
import { WebsocketRequestHandler } from "express-ws";

export function nodeWebSocketBridge(bus: EventBus): WebsocketRequestHandler {
  return function (ws, _req) {
    const eventListener = function requestListener(event: InterceptEvent) {
      ws.send(JSON.stringify({ type: "intercept", detail: event }));
    };
    const removeListener = bus.onIntercept(eventListener);

    ws.on("message", function (msg) {
      console.info("WebSocket message", arguments);
      bus.dispatch(JSON.parse(msg as string));
    });

    ws.on("close", function () {
      console.info("WebSocket close", arguments);
      removeListener();
    });
  };
}
