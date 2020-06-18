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
  dispatchOptionOverride?: boolean;
  interceptorUuid: string;
  invocationUuid: string;
  sourceUuid: string[];
}

// Bypass never calls the original code
export interface BypassEvent extends BaseEvent {
  trigger: Trigger.bypass;
  args?: any[];
  rv?: any;
  dispatchOptionsReturnValue?: any[];
}

export type DispatchOptions = Array<{ label?: string; value: any }>;

export interface CallEvent extends BaseEvent {
  trigger: Trigger.call;
  args?: any[];
  dispatchOptionsArguments?: DispatchOptions;
}

export interface ReturnEvent extends BaseEvent {
  trigger: Trigger.return;
  args?: any[];
  rv?: any;
  dispatchOptionsReturnValue?: DispatchOptions;
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

type UnwrapPromise<T> = T extends PromiseLike<infer U> ? U : never;

export type InterceptOptions<C extends InterceptedFunction> =
  | InterceptOptionsCall<C>
  | InterceptOptionsReturn<C>
  | InterceptOptionsBoth<C>
  | InterceptOptionsBypass<C>;

export interface InterceptOptionsCall<C extends InterceptedFunction> {
  trigger: Trigger.call;
  uuid?: string;
  dispatchOptionsArguments?: Array<{ label?: string; value: Parameters<C> }>;
  dispatchOptionOverride?: boolean;
}

export interface InterceptOptionsReturn<C extends InterceptedFunction> {
  trigger: Trigger.return;
  uuid?: string;
  dispatchOptionsReturnValue?: Array<{
    label?: string;
    value: UnwrapPromise<ReturnType<C>>;
  }>;
  dispatchOptionOverride?: boolean;
}

export interface InterceptOptionsBoth<C extends InterceptedFunction> {
  trigger: Trigger.both;
  uuid?: string;
  dispatchOptionsArguments?: Array<{ label?: string; value: Parameters<C> }>;
  dispatchOptionsReturnValue?: Array<{
    label?: string;
    value: UnwrapPromise<ReturnType<C>>;
  }>;
  dispatchOptionOverride?: boolean;
}

export interface InterceptOptionsBypass<C extends InterceptedFunction> {
  trigger: Trigger.bypass;
  uuid?: string;
  dispatchOptionsReturnValue?: Array<{
    label?: string;
    value: UnwrapPromise<ReturnType<C>>;
  }>;
  dispatchOptionOverride?: boolean;
}
