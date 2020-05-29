// Bypass never calls the original code
export interface BypassEvent {
  trigger: "bypass";
  interceptorUuid: string;
  invocationUuid: string;
  args?: any[];
  rv?: any;
}

export interface CallEvent {
  trigger: "call";
  interceptorUuid: string;
  invocationUuid: string;
  args?: any[];
}

export interface ReturnEvent {
  trigger: "return";
  interceptorUuid: string;
  invocationUuid: string;
  args?: any[];
  rv?: any;
}

export type InterceptEvent = BypassEvent | CallEvent | ReturnEvent;

export type Trigger = "bypass" | "call" | "return" | "both";

export interface BusEvent {
  direction: "capture" | "dispatch";
  event: InterceptEvent;
}

export interface EventBusEvent {
  type: string;
  detail: InterceptEvent;
}

export type RemoveListener = () => void;

export type InterceptHandler = (event: InterceptEvent) => void;

export interface InterceptBus {
  capture: InterceptHandler;
  dispatch: InterceptHandler;
  onCapture: (listener: InterceptHandler) => RemoveListener;
  onDispatch: (listener: InterceptHandler) => RemoveListener;
}

export type InterceptedFunction =
  | (() => Promise<any>)
  | ((...args: any[]) => Promise<any>);
