// This version is not cryptographically safe
export function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface BaseEvent {
  direction: "capture" | "dispatch";
  interceptorUuid: string;
  invocationUuid: string;
  sourceUuid: string[];
}

// Bypass never calls the original code
export interface BypassEvent extends BaseEvent {
  trigger: Trigger.bypass;
  args?: any[];
  rv?: any;
}

export interface CallEvent extends BaseEvent {
  trigger: Trigger.call;
  args?: any[];
}

export interface ReturnEvent extends BaseEvent {
  trigger: Trigger.return;
  args?: any[];
  rv?: any;
}

export type InterceptEvent = BypassEvent | CallEvent | ReturnEvent;

export enum Trigger {
  bypass = "bypass",
  call = "call",
  return = "return",
  both = "both",
}

export type RemoveListener = () => void;

export type InterceptHandler = (event: InterceptEvent) => void;

export interface InterceptBus {
  capture: InterceptHandler;
  dispatch: InterceptHandler;
  event: InterceptHandler;
  onCapture: (listener: InterceptHandler) => RemoveListener;
  onDispatch: (listener: InterceptHandler) => RemoveListener;
  onEvent: (listener: InterceptHandler) => RemoveListener;
}

export type InterceptedFunction =
  | (() => Promise<any>)
  | ((...args: any[]) => Promise<any>);

export interface InterceptOptions {
  uuid?: string;
}
