import { EventBus, EventBusEvent } from "./interceptor";

class BrowserEventBus implements EventBus {
  private bus: EventTarget;

  constructor() {
    this.bus = new EventTarget();
  }

  addEventListener<T>(typ: string, el: (e: EventBusEvent<T>) => void): void {
    console.info("BrowserEventBus.addEventListener", arguments);
    this.bus.addEventListener(typ, (el as unknown) as EventListener);
  }

  dispatchEvent(e: EventBusEvent<any>): void {
    console.info("BrowserEventBus.dispatchEvent", arguments);
    this.bus.dispatchEvent(new CustomEvent(e.type, { detail: e.detail }));
  }

  removeEventListener(typ: string, el: (e: EventBusEvent<any>) => void): void {
    console.info("BrowserEventBus.removeEventListener", arguments);
    this.bus.removeEventListener(typ, (el as unknown) as EventListener);
  }
}

export const eventBus = new BrowserEventBus();
