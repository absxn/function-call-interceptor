import { BusEvent, InterceptBus, InterceptEvent } from "../../app/src/types";
import { WebsocketRequestHandler } from "express-ws";

export function nodeWebSocketBridge(
  bus: InterceptBus
): WebsocketRequestHandler {
  const relay: { [uuid: string]: true } = {};
  return function (ws, _req) {
    const eventListener = (direction: string) => (event: InterceptEvent) => {
      if (relay.hasOwnProperty(event.invocationUuid)) {
        // Prevent feedback loop of bridging back event that we just received
        delete relay[event.invocationUuid];
        return;
      }
      const data = JSON.stringify({ direction, event });
      console.info("WebSocket send", data);
      ws.send(data);
    };
    const removeCaptureListener = bus.onCapture(eventListener("capture"));
    const removeDispatchListener = bus.onDispatch(eventListener("dispatch"));

    ws.on("message", function (msg) {
      console.info("WebSocket message", arguments);
      const event: BusEvent = JSON.parse(msg as string);
      relay[event.event.invocationUuid] = true;
      if (event.direction === "capture") {
        bus.capture(event.event);
      } else if (event.direction === "dispatch") {
        bus.dispatch(event.event);
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
