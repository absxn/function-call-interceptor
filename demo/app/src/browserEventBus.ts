import { EventBus, InterceptEvent } from "./types";

export class BrowserEventBus implements EventBus {
  private static busName = "event";
  private bus: EventTarget;

  constructor() {
    this.bus = new EventTarget();
  }

  onDispatch(el: (e: InterceptEvent) => void) {
    console.info("BrowserEventBus.onDispatch", arguments);
    const listener = (e: any) =>
      e.detail.direction === "dispatch" ? el(e.detail.event) : null;
    this.bus.addEventListener(BrowserEventBus.busName, listener);
    return () =>
      this.bus.removeEventListener(BrowserEventBus.busName, listener);
  }

  onIntercept(el: (e: InterceptEvent) => void) {
    console.info("BrowserEventBus.onIntercept", arguments);
    const listener = (e: any) =>
      e.detail.direction === "intercept" ? el(e.detail.event) : null;
    this.bus.addEventListener(BrowserEventBus.busName, listener);
    return () =>
      this.bus.removeEventListener(BrowserEventBus.busName, listener);
  }

  intercept(e: InterceptEvent): void {
    console.info("BrowserEventBus.intercept", arguments);
    this.bus.dispatchEvent(
      new CustomEvent(BrowserEventBus.busName, {
        detail: { direction: "intercept", event: e },
      })
    );
  }

  dispatch(e: InterceptEvent): void {
    console.info("BrowserEventBus.dispatch", arguments);
    this.bus.dispatchEvent(
      new CustomEvent(BrowserEventBus.busName, {
        detail: { direction: "dispatch", event: e },
      })
    );
  }
}
