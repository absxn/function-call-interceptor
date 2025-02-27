/* eslint-disable @typescript-eslint/no-explicit-any */

// This version is not cryptographically safe
export function uuidv4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export type DispatchOptions = Array<{ label?: string; value: unknown }>;

export interface DispatchBaseEvent {
  direction: "dispatch";
  interceptorUuid: string;
  invocationUuid: string;
  sourceUuid: string[];
}

// Bypass never calls the original code
export interface DispatchBypassEvent extends DispatchBaseEvent {
  trigger: Trigger.bypass;
  args?: any[];
  rv?: any;
}

export interface DispatchCallEvent extends DispatchBaseEvent {
  trigger: Trigger.call;
  args?: any[];
}

export interface DispatchReturnEvent extends DispatchBaseEvent {
  trigger: Trigger.return;
  args?: any[];
  rv?: any;
}

export interface CaptureBaseEvent {
  direction: "capture";
  dispatchOptionOverride?: boolean;
  interceptorUuid: string;
  invocationUuid: string;
  sourceUuid: string[];
}

// Bypass never calls the original code
export interface CaptureBypassEvent extends CaptureBaseEvent {
  trigger: Trigger.bypass;
  args?: any[];
  rv?: any;
  dispatchOptionsReturnValue?: DispatchOptions;
}

export interface CaptureCallEvent extends CaptureBaseEvent {
  trigger: Trigger.call;
  args?: any[];
  dispatchOptionsArguments?: DispatchOptions;
}

export interface CaptureReturnEvent extends CaptureBaseEvent {
  trigger: Trigger.return;
  args?: any[];
  rv?: any;
  dispatchOptionsReturnValue?: DispatchOptions;
}

export type CaptureEvent =
  | CaptureBypassEvent
  | CaptureCallEvent
  | CaptureReturnEvent;

export type DispatchEvent =
  | DispatchBypassEvent
  | DispatchCallEvent
  | DispatchReturnEvent;

export enum Trigger {
  bypass = "bypass",
  call = "call",
  return = "return",
  both = "both",
}

export type RemoveListener = () => void;

export type CaptureHandler = (event: CaptureEvent) => void;

export type DispatchHandler = (event: DispatchEvent) => void;

export type InterceptEvent = CaptureEvent | DispatchEvent;

export type InterceptHandler = (event: InterceptEvent) => void;

export interface InterceptBus {
  capture: CaptureHandler;
  dispatch: DispatchHandler;
  event: InterceptHandler;
  onCapture: (listener: CaptureHandler) => RemoveListener;
  onDispatch: (listener: DispatchHandler) => RemoveListener;
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

interface CommonInterceptOptions {
  timeoutMs?: number;
  uuid?: string;
  dispatchOptionOverride?: boolean;
}

export interface InterceptOptionsCall<C extends InterceptedFunction>
  extends CommonInterceptOptions {
  trigger: Trigger.call;
  dispatchOptionsArguments?: Array<{ label?: string; value: Parameters<C> }>;
}

export interface InterceptOptionsReturn<C extends InterceptedFunction>
  extends CommonInterceptOptions {
  trigger: Trigger.return;
  dispatchOptionsReturnValue?: Array<{
    label?: string;
    value: UnwrapPromise<ReturnType<C>>;
  }>;
}

export interface InterceptOptionsBoth<C extends InterceptedFunction>
  extends CommonInterceptOptions {
  trigger: Trigger.both;
  dispatchOptionsArguments?: Array<{ label?: string; value: Parameters<C> }>;
  dispatchOptionsReturnValue?: Array<{
    label?: string;
    value: UnwrapPromise<ReturnType<C>>;
  }>;
}

export interface InterceptOptionsBypass<C extends InterceptedFunction>
  extends CommonInterceptOptions {
  trigger: Trigger.bypass;
  dispatchOptionsReturnValue?: Array<{
    label?: string;
    value: UnwrapPromise<ReturnType<C>>;
  }>;
}
