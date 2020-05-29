import { InterceptBus, InterceptEvent } from "../../app/src/types";
import { WebsocketRequestHandler } from "express-ws";

export function nodeWebSocketBridge(
  bus: InterceptBus
): WebsocketRequestHandler {
  return function (ws, _req) {
    const eventListener = (event: InterceptEvent) => {
      const data = JSON.stringify(event);
      console.info("WebSocket send", data);
      ws.send(data);
    };
    const removeCaptureListener = bus.onCapture(eventListener);
    const removeDispatchListener = bus.onDispatch(eventListener);

    ws.on("message", function (msg) {
      console.info("WebSocket message", arguments);
      const event: InterceptEvent = JSON.parse(msg as string);
      if (event.direction === "capture") {
        bus.capture(event);
      } else if (event.direction === "dispatch") {
        bus.dispatch(event);
      } else {
        console.error("Unexpected direction", event);
      }
    });

    ws.on("close", function () {
      console.info("WebSocket close", arguments);
      removeCaptureListener();
      removeDispatchListener();
    });
  };
}
