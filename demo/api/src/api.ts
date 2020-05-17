import bodyParser from "body-parser";
import cors from "cors";
import expressWs from "express-ws";

const { app } = expressWs(require("express")());

app.use(cors());
app.use(bodyParser.json());

app.ws("/ws", function (ws, _req) {
  ws.on("message", function (msg) {
    console.info("WebSocket send(", msg, ")");
    ws.send(msg);
  });
});

app.post("/", function (req, res) {
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

  const sum = numbers.reduce((agg, val) => agg + val, 0);
  console.info("sum(", numbers, ") =", sum);
  res.send({ sum });
});

app.listen(3001);
