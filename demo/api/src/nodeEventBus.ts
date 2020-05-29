import { BusEvent, EventBus, InterceptEvent } from "../../app/src/types";
import { EventEmitter } from "events";

class BusEmitter extends EventEmitter {}

export class NodeEventBus implements EventBus {
  private bus: BusEmitter;

  constructor() {
    this.bus = new BusEmitter();
  }

  onDispatch(el: (e: InterceptEvent) => void): () => void {
    console.info("NodeEventBus.onDispatch", arguments);
    const listener = (e: { detail: BusEvent }) =>
      e.detail.direction === "dispatch" ? el(e.detail.event) : null;
    this.bus.on("event", listener);
    return () => this.bus.removeListener("intercept", listener);
  }

  onIntercept(el: (e: InterceptEvent) => void): () => void {
    console.info("NodeEventBus.onIntercept", arguments);
    const listener = (e: { detail: BusEvent }) =>
      e.detail.direction === "intercept" ? el(e.detail.event) : null;
    this.bus.on("event", listener);
    return () => this.bus.removeListener("intercept", listener);
  }

  dispatch(event: InterceptEvent): void {
    console.info("NodeEventBus.dispatch", arguments);
    this.bus.emit("event", { direction: "dispatch", event });
  }
}
