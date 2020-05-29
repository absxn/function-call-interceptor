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
  direction: "intercept" | "dispatch";
  event: InterceptEvent;
}

export interface EventBusEvent {
  type: string;
  detail: InterceptEvent;
}

export type RemoveListener = () => void;

export interface EventBus {
  onDispatch: (el: (e: InterceptEvent) => void) => RemoveListener;
  onIntercept: (el: (e: InterceptEvent) => void) => RemoveListener;
  intercept: (e: InterceptEvent) => void;
  dispatch: (e: InterceptEvent) => void;
}

export type InterceptedFunction =
  | (() => Promise<any>)
  | ((...args: any[]) => Promise<any>);
