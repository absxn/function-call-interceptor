import { InterceptBus, InterceptEvent, InterceptHandler } from "./types";

export class EventBus implements InterceptBus {
  private captureHandlers: { [id: number]: InterceptHandler } = {};
  private dispatchHandlers: { [id: number]: InterceptHandler } = {};
  private handlerCounter = 0;

  constructor() {}

  onDispatch(handler: InterceptHandler) {
    const id = this.handlerCounter;
    this.handlerCounter++;

    this.dispatchHandlers[id] = handler;
    console.info(`EventBus.onDispatch() #${id}`);

    return () => {
      console.info(`+ EventBus.onDispatch() deregister #${id}`);
      return delete this.dispatchHandlers[id];
    };
  }

  onCapture(handler: InterceptHandler) {
    const id = this.handlerCounter;
    this.handlerCounter++;

    this.captureHandlers[id] = handler;
    console.info(`EventBus.onCapture(): #${id}`);

    return () => {
      console.info(`+ EventBus.onCapture() deregister #${id}`);
      return delete this.captureHandlers[id];
    };
  }

  capture(event: InterceptEvent): void {
    console.info("EventBus.capture", event);
    for (const [id, handler] of Object.entries(this.captureHandlers)) {
      console.info(`+ EventBus.capture notify #${id}`);
      handler(event);
    }
  }

  dispatch(event: InterceptEvent): void {
    console.info("EventBus.dispatch", arguments);
    for (const [id, handler] of Object.entries(this.dispatchHandlers)) {
      console.info(`+ EventBus.dispatch notify #${id}`);
      handler(event);
    }
  }
}
