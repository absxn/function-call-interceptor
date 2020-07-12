import React from "react";
import { ActiveHooks, OnHookAdd, OnHookRemove } from "../types";
import HookDefinition from "../Components/HookDefinition";

interface HookModalProps {
  hooks: ActiveHooks;
  onAdd: OnHookAdd;
  onRemove: OnHookRemove;
}

const HookModal: React.FC<HookModalProps> = (props) => (
  <>
    <table style={{ width: "100%" }}>
      <thead>
        <tr>
          <th>Capture mask</th>
          <th>Action</th>
          <th>Delay (ms)</th>
          <th>Hits</th>
          <th>Hits left</th>
        </tr>
      </thead>
      <tbody>
        {props.hooks.map((hook, index) => (
          <tr
            key={index}
            style={{ color: hook.hitLimit === 0 ? "gray" : "black" }}
          >
            <td>{hook.uuidMask.toString()}</td>
            <td>{hook.hookConfiguration.action}</td>
            <td>{hook.hookConfiguration.delayMs}ms</td>
            <td>{hook.hitCount}</td>
            <td>{hook.hitLimit}</td>
            <td
              style={{
                color: "red",
                textDecoration: "underline",
                cursor: "pointer",
              }}
              onClick={() => {
                props.onRemove(index);
              }}
            >
              Remove
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    <HookDefinition onAdd={props.onAdd} />
  </>
);

export default HookModal;
