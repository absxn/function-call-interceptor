import express from "express";
import bodyParser from "body-parser";

const app = express();

app.use(bodyParser.json());

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

  res.send({ sum: numbers.reduce((agg, val) => agg + val, 0) });
});

app.listen(3001);
