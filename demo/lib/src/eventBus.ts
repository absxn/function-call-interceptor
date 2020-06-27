import {
  InterceptBus,
  InterceptedFunction,
  CaptureEvent,
  InterceptHandler,
  InterceptOptions,
  uuidv4,
  DispatchEvent,
  DispatchHandler,
  CaptureHandler,
  InterceptEvent,
} from "./types";
import { intercept } from "./interceptor";

export class EventBus implements InterceptBus {
  private eventHandlers: {
    [id: number]: (event: InterceptEvent) => InterceptHandler;
  } = {};
  private handlerCounter = 0;
  private readonly uuid: string;

  constructor(options?: { uuid?: string }) {
    this.uuid = options?.uuid || uuidv4();
  }

  getInterceptor() {
    return <C extends InterceptedFunction, A extends Parameters<C>>(
      cb: C,
      options: InterceptOptions<C>
    ): C => {
      return intercept(this, cb, options);
    };
  }

  onEvent(
    handler: InterceptHandler,
    filter: (event: CaptureEvent | DispatchEvent) => boolean = () => true
  ) {
    const id = this.handlerCounter;
    this.handlerCounter++;

    this.eventHandlers[id] = (event) => (filter(event) ? handler : () => null);
    console.info(`EventBus.onEvent() #${id}`);

    return () => {
      console.info(`+ EventBus.onEvent() deregister #${id}`);
      return delete this.eventHandlers[id];
    };
  }

  onDispatch(handler: DispatchHandler) {
    this.handlerCounter++;

    return this.onEvent(handler, (event) => event.direction === "dispatch");
  }

  onCapture(handler: CaptureHandler) {
    this.handlerCounter++;

    return this.onEvent(handler, (event) => event.direction === "capture");
  }

  capture(event: CaptureEvent): void {
    console.info("EventBus.capture", event);
    if (event.direction !== "capture") {
      console.error("+ EventBus.capture dropping non-capture message");
      return;
    }
    if (event.sourceUuid.includes(this.uuid)) {
      console.warn("+ EventBus.capture dropping loopback message");
      return;
    }
    for (const [id, getHandler] of Object.entries(this.eventHandlers)) {
      const handler = getHandler(event);
      if (handler !== null) {
        console.info(`+ EventBus.capture notify #${id}`);
        handler({ ...event, sourceUuid: [this.uuid].concat(event.sourceUuid) });
      }
    }
  }

  dispatch(event: DispatchEvent): void {
    console.info("EventBus.dispatch", arguments);
    if (event.direction !== "dispatch") {
      console.error("+ EventBus.dispatch dropping non-dispatch message");
      return;
    }
    if (event.sourceUuid.includes(this.uuid)) {
      console.warn("+ EventBus.dispatch dropping loopback message");
      return;
    }
    for (const [id, getHandler] of Object.entries(this.eventHandlers)) {
      const handler = getHandler(event);
      if (handler !== null) {
        console.info(`+ EventBus.dispatch notify #${id}`);
        handler({ ...event, sourceUuid: [this.uuid].concat(event.sourceUuid) });
      }
    }
  }

  event(event: InterceptEvent): void {
    console.info("EventBus.event", arguments);
    if (event.sourceUuid.includes(this.uuid)) {
      console.warn("+ EventBus.event dropping loopback message");
      return;
    }
    for (const [id, getHandler] of Object.entries(this.eventHandlers)) {
      const handler = getHandler(event);
      if (handler !== null) {
        console.info(`+ EventBus.event notify #${id}`);
        handler({ ...event, sourceUuid: [this.uuid].concat(event.sourceUuid) });
      }
    }
  }
}
