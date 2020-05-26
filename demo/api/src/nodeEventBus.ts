import { EventBus, EventBusEvent } from "../../app/src/interceptor";
import { EventEmitter } from "events";

class BusEmitter extends EventEmitter {}

export class NodeEventBus implements EventBus {
  private bus: BusEmitter;

  constructor() {
    this.bus = new BusEmitter();
  }

  addEventListener<T>(typ: string, el: (e: EventBusEvent<T>) => void): void {
    console.info("NodeEventBus.addEventListener", arguments);
    this.bus.on(typ, (el as unknown) as EventListener);
  }

  dispatchEvent(event: EventBusEvent<any>): void {
    console.info("NodeEventBus.dispatchEvent", arguments);
    this.bus.emit(event.type, event);
  }

  removeEventListener(typ: string, el: (e: EventBusEvent<any>) => void): void {
    console.info("NodeEventBus.removeEventListener", arguments);
    this.bus.removeListener(typ, (el as unknown) as EventListener);
  }
}
