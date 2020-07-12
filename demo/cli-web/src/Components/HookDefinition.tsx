import React from "react";
import { Action, OnHookAdd } from "../types";

interface HookDefinitionState {
  actionString: Action;
  uuidMaskString: string;
  delayString: string;
  hitLimitString: string;
}

interface HookDefinitionProps {
  onAdd: OnHookAdd;
}

export default class HookDefinition extends React.Component<
  HookDefinitionProps,
  HookDefinitionState & { isValid: boolean }
> {
  state = {
    actionString: "suspend" as const,
    uuidMaskString: ".*",
    delayString: "0",
    hitLimitString: "-1",
    isValid: true,
  };

  render(): JSX.Element {
    return (
      <fieldset>
        <label>
          Action
          <select
            onChange={(e) =>
              this.setState(
                {
                  actionString: e.currentTarget.value as Action,
                  isValid: false,
                },
                this.validate
              )
            }
            value={this.state.actionString}
          >
            <option value="suspend">Suspend</option>
            <option value="pass-through">Pass-through</option>
          </select>
        </label>
        <label>
          UUID pattern
          <input
            type="text"
            onChange={(e) =>
              this.setState(
                {
                  uuidMaskString: e.currentTarget.value,
                  isValid: false,
                },
                this.validate
              )
            }
            value={this.state.uuidMaskString}
          />
        </label>
        <label>
          Delay
          <input
            type="text"
            onChange={(e) =>
              this.setState(
                {
                  delayString: e.currentTarget.value,
                  isValid: false,
                },
                this.validate
              )
            }
            value={this.state.delayString}
          />
        </label>
        <label>
          Hit limit
          <input
            type="text"
            onChange={(e) =>
              this.setState(
                {
                  hitLimitString: e.currentTarget.value,
                  isValid: false,
                },
                this.validate
              )
            }
            value={this.state.hitLimitString}
          />
        </label>
        <button
          onClick={() =>
            this.props.onAdd({
              action: this.state.actionString as Action,
              delayMs: parseInt(this.state.delayString, 0),
              uuidMask: new RegExp(this.state.uuidMaskString),
              hitLimit: parseInt(this.state.hitLimitString, 0),
            })
          }
          disabled={!this.state.isValid}
        >
          Add
        </button>
      </fieldset>
    );
  }

  private validate() {
    function isValidTrigger(action: string) {
      const valid: Action[] = ["suspend", "pass-through"];
      return valid.includes(action as Action);
    }

    function isValidRegExp(regExpString: string) {
      try {
        new RegExp(regExpString);
        return true;
      } catch (e) {
        return false;
      }
    }

    this.setState({
      isValid:
        !isNaN(parseInt(this.state.delayString, 10)) &&
        !isNaN(parseInt(this.state.hitLimitString, 10)) &&
        isValidRegExp(this.state.uuidMaskString) &&
        isValidTrigger(this.state.actionString),
    });
  }
}
