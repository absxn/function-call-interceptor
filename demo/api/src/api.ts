import bodyParser from "body-parser";
import cors from "cors";
import expressWs from "express-ws";
import { intercept, EventBus, Trigger } from "@interceptor/lib";
import { RequestHandler } from "express-serve-static-core";
import { nodeWebSocketBridge } from "./nodeWebSocketBridge";

const { app } = expressWs(require("express")());

app.use(cors());
app.use(bodyParser.json());

export const eventBus = new EventBus({ uuid: "api" });

app.ws("/ws", nodeWebSocketBridge(eventBus));

function parseInput(req: any): number[] | null {
  const body: any = req.body;
  if (
    !body.hasOwnProperty("numbers") ||
    !(body.numbers instanceof Array) ||
    body.numbers.filter((x: any) => typeof x !== "number").length > 0
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

app.post(
  "/interceptor-demo/call",
  demoWrapper((numbers) =>
    intercept(
      eventBus,
      (ns: number[]) => {
        return Promise.resolve(ns.reduce((agg, val) => agg + val, 0));
      },
      { uuid: "apicall", trigger: Trigger.call }
    )(numbers)
  )
);

app.post(
  "/interceptor-demo/return",
  demoWrapper((numbers) =>
    intercept(
      eventBus,
      (ns: number[]) => {
        return Promise.resolve(ns.reduce((agg, val) => agg + val, 0));
      },
      { trigger: Trigger.return }
    )(numbers)
  )
);

app.post(
  "/interceptor-demo/both",
  demoWrapper((numbers) =>
    intercept(
      eventBus,
      (ns: number[]) => {
        return Promise.resolve(ns.reduce((agg, val) => agg + val, 0));
      },
      { trigger: Trigger.both }
    )(numbers)
  )
);

app.post(
  "/interceptor-demo/bypass",
  demoWrapper((numbers) =>
    intercept(
      eventBus,
      (ns: number[]) => {
        return Promise.resolve(ns.reduce((agg, val) => agg + val, 0));
      },
      { trigger: Trigger.bypass }
    )(numbers)
  )
);

const port = 3001;
console.info(`Listening port ${port}`);
app.listen(port);
