import bodyParser from "body-parser";
import cors from "cors";
import expressWs from "express-ws";
import { EventBus, Trigger } from "@interceptor/lib";
import { Request, RequestHandler } from "express-serve-static-core";
import { nodeWebSocketBridge } from "./nodeWebSocketBridge";

import express from "express";

const { app } = expressWs(express());

app.use(cors());
app.use(bodyParser.json());

export const eventBus = new EventBus({ uuid: "api" });

const intercept = eventBus.getInterceptor();

app.ws("/ws", nodeWebSocketBridge(eventBus));

function parseInput(req: Request): number[] | null {
  const body = req.body;
  if (
    !Object.prototype.hasOwnProperty.call(body, "numbers") ||
    !(body.numbers instanceof Array) ||
    body.numbers.filter((x: unknown) => typeof x !== "number").length > 0
  ) {
    return null;
  }
  return req.body.numbers;
}

function demoWrapper(cb: (n: number[]) => Promise<number>): RequestHandler {
  return async (req, res) => {
    const numbers = parseInput(req);
    if (numbers === null) {
      res.send({ error: "Expecting body of type {numbers: number[]}" });
      return;
    }

    const sum = await cb(numbers);

    console.info("sum(", numbers, ") =", sum);
    res.send({ sum });
  };
}

const sum = (ns: number[]) =>
  Promise.resolve(ns.reduce((agg, val) => agg + val, 0));

app.post(
  "/interceptor-demo/call",
  demoWrapper((numbers) =>
    intercept(sum, {
      uuid: "apicall",
      trigger: Trigger.call,
      timeoutMs: 2001,
    })(numbers)
  )
);

app.post(
  "/interceptor-demo/return",
  demoWrapper((numbers) =>
    intercept(sum, { trigger: Trigger.return, timeoutMs: 10000 })(numbers)
  )
);

app.post(
  "/interceptor-demo/both",
  demoWrapper((numbers) =>
    intercept(sum, { trigger: Trigger.both, timeoutMs: 10000 })(numbers)
  )
);

app.post(
  "/interceptor-demo/bypass",
  demoWrapper((numbers) =>
    intercept(sum, { trigger: Trigger.bypass, timeoutMs: 10000 })(numbers)
  )
);

const port = 3001;
console.info(`Listening port ${port}`);
app.listen(port);
