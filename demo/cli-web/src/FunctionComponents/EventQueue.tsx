import React, { CSSProperties } from "react";
import { Trigger } from "@interceptor/lib";
import { CapturedEvents } from "../types";

const ActiveEventStyle: CSSProperties = {
  color: "red",
  textDecoration: "underline",
};

const EventQueue: React.FC<{
  queue: CapturedEvents;
  activeEvent: number;
  onClick: (activeEvent: number) => void;
}> = ({ queue, activeEvent, onClick }) => (
  <ol>
    {queue.map((e, index) => {
      const uuidString = `${e.interceptorUuid.split("-")[0]}.${
        e.invocationUuid.split("-")[0]
      }`;
      return (
        <li key={index} style={index === activeEvent ? ActiveEventStyle : {}}>
          <span onClick={() => onClick(index)}>
            uuid({uuidString}
            {") "}
            {e.trigger === Trigger.call ? (
              <code>call({JSON.stringify(e.args)}) =&gt; ?</code>
            ) : (
              <code>
                return({JSON.stringify(e.args)}) =&gt; {JSON.stringify(e.rv)}
              </code>
            )}
          </span>
        </li>
      );
    })}
  </ol>
);

export default EventQueue;
