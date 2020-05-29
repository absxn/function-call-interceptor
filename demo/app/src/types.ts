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

export interface EventBusEvent<T> {
  type: string;
  detail: T;
}

export interface EventBus {
  addEventListener: (typ: string, el: (e: EventBusEvent<any>) => void) => void;
  dispatchEvent: (e: EventBusEvent<any>) => void;
  removeEventListener: (
    typ: string,
    el: (e: EventBusEvent<any>) => void
  ) => void;
}

export type InterceptedFunction =
  | (() => Promise<any>)
  | ((...args: any[]) => Promise<any>);
