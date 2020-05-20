import bodyParser from "body-parser";
import cors from "cors";
import expressWs from "express-ws";
import {
  CallEvent,
  EventBus,
  EventBusEvent,
  intercept,
} from "../../app/src/interceptor";
import { EventEmitter } from "events";

const { app } = expressWs(require("express")());

app.use(cors());
app.use(bodyParser.json());

class BusEmitter extends EventEmitter {}

class NodeEventBus implements EventBus {
  private bus: BusEmitter;

  constructor() {
    this.bus = new BusEmitter();
  }

  addEventListener<T>(typ: string, el: (e: EventBusEvent<T>) => void): void {
    console.info("NodeEventBus.addEventListener", arguments);
    this.bus.on(typ, (el as unknown) as EventListener);
  }

  dispatchEvent(event: EventBusEvent<any>): void {
    console.info("NodeEventBus.dispatchEvent", arguments);
    this.bus.emit(event.type, event);
  }

  removeEventListener(typ: string, el: (e: EventBusEvent<any>) => void): void {
    console.info("NodeEventBus.removeEventListener", arguments);
    this.bus.removeListener(typ, (el as unknown) as EventListener);
  }
}

export const eventBus = new NodeEventBus();

app.ws("/ws", function (ws, _req) {
  console.log("/ws");
  const eventListener = function requestListener(
    event: EventBusEvent<CallEvent>
  ) {
    console.log("requestListener", event);
    console.log("type", typeof event);
    ws.send(JSON.stringify(event));
  };
  eventBus.addEventListener("call", eventListener);

  ws.on("message", function (msg) {
    console.info("WebSocket message", arguments);
    eventBus.dispatchEvent(JSON.parse(msg as string));
  });

  ws.on("close", function () {
    console.info("WebSocket close", arguments);
    eventBus.removeEventListener("call", eventListener);
  });
});

app.post("/", async function (req, res) {
  const body: any = req.body;
  if (
    !body.hasOwnProperty("numbers") ||
    !(body.numbers instanceof Array) ||
    body.numbers.filter((x: any) => typeof x !== "number").length > 0
  ) {
    res.send({ error: "Expecting body of type {numbers: number[]}" });
    return;
  }

  const numbers: number[] = req.body.numbers;

  const sum = await intercept(
    eventBus,
    (ns: number[]) => {
      return Promise.resolve(ns.reduce((agg, val) => agg + val, 0));
    },
    "call"
  )(numbers);
  console.info("sum(", numbers, ") =", sum);
  res.send({ sum });
});

const port = 3001;
console.info(`Listening port ${port}`);
app.listen(port);
