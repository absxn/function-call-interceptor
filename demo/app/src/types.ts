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

export interface EventBusEvent {
  type: string;
  detail: InterceptEvent;
}

export interface EventBus {
  addEventListener: (typ: string, el: (e: EventBusEvent) => void) => void;
  dispatchEvent: (e: EventBusEvent) => void;
  removeEventListener: (typ: string, el: (e: EventBusEvent) => void) => void;
}

export type InterceptedFunction =
  | (() => Promise<any>)
  | ((...args: any[]) => Promise<any>);
