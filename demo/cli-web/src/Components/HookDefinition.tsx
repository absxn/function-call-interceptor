import React from "react";
import { HookTypes, OnHookAdd } from "../types";

interface HookDefinitionState {
  triggerString: string;
  uuidMaskString: string;
  delayString: string;
}

interface HookDefinitionProps {
  onAdd: OnHookAdd;
}

export default class HookDefinition extends React.Component<
  HookDefinitionProps,
  HookDefinitionState & { isValid: boolean }
> {
  state = {
    triggerString: "suspend",
    uuidMaskString: ".*",
    delayString: "0",
    isValid: true,
  };

  render() {
    return (
      <fieldset>
        <label>
          Trigger
          <select
            onChange={(e) =>
              this.setState(
                {
                  triggerString: e.currentTarget.value,
                  isValid: false,
                },
                this.validate
              )
            }
            value={this.state.triggerString}
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
        <button
          onClick={() =>
            this.props.onAdd({
              action: this.state.triggerString as HookTypes,
              delayMs: parseInt(this.state.delayString, 0),
              uuidMask: new RegExp(this.state.uuidMaskString),
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
    function isValidTrigger(trigger: string) {
      const valid: HookTypes[] = ["suspend", "pass-through"];
      return valid.includes(trigger as HookTypes);
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
        isValidRegExp(this.state.uuidMaskString) &&
        isValidTrigger(this.state.triggerString),
    });
  }
}
