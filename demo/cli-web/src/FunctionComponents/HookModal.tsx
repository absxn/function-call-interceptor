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
      <tbody>
        {props.hooks.map((hook, index) => (
          <tr key={index}>
            <td>{hook.uuidMask.toString()}</td>
            <td>{hook.hookConfiguration.hook}</td>
            <td>{hook.hookConfiguration.delayMs}ms</td>
            <td>{hook.hitCount}</td>
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
