import { CaptureEvent, DispatchEvent } from "@interceptor/lib";

export type CapturedEvents = Array<CaptureEvent>;

export type Action = "suspend" | "pass-through";

export type HookConfiguration = {
  action: Action;
  delayMs: number;
};

export interface HookSetup {
  uuidMask: RegExp;
  delayMs: number;
  action: Action;
  hitLimit: number;
}

export type ActiveHooks = Array<{
  uuidMask: RegExp;
  hookConfiguration: HookConfiguration;
  hitCount: number;
  hitLimit: number; // -1 = no limit, 0 = disable hook
}>;

export type DispatchSubmitHandler = (
  eventToRemove: number,
  event: DispatchEvent,
  hookConfiguration: HookConfiguration | null
) => void;

export type OnHookAdd = (hookSetup: HookSetup) => void;

export type OnHookRemove = (index: number, skipRender?: boolean) => void;

export type OnToggleVisible = (isVisible: boolean) => void;

export interface RenderState {
  domId: string;
  visible: boolean;
  queue: CapturedEvents;
  hooks: ActiveHooks;
  onDispatchSubmit: DispatchSubmitHandler;
  onHookAdd: OnHookAdd;
  onHookRemove: OnHookRemove;
  onToggleVisible: OnToggleVisible;
}
