const express = require("express");
const { Validator } = require("./database/mongodb");
const { getRandomInt } = require("./provider/random")

const app = express();

const port = 3000;

app.use(express.json());

app.get("/", (req, res) => res.json({ message: "hello world" }));

app.post("/validator", async (req, res) => {
  const { name, ip, stake = 0 } = req.body;

  const sla = await Validator.create({ name, ip, stake });
  return res.json({ ok: sla });
});

app.get("/validator", async (req, res) => {
  const sla = await Validator.find({});
  return res.json({ ok: sla });
});

app.get("/validator/:id", async (req, res) => {
  const { id } = req.params;
  const sla = await Validator.find({ _id: id });
  return res.json({ sla });
});

app.put("/validator/:id", async (req, res) => {
  const { id } = req.params;
  const { name, ip, stake } = req.body;
  const sla = await Validator.updateOne({ _id: id }, { name, ip, stake });
  return res.json({ sla });
});

app.delete("/validator/:id", async (req, res) => {
  const { id } = req.params;
  const sla = await Validator.deleteOne({ _id: id });
  return res.json({ sla });
});

app.get("/elect", async (req, res) => {
  const validators = await Validator.find();
  let sum = 0;
  for (const validator of validators) {
    sum += validator.stake;
  }
  let value = getRandomInt(0, sum);
  sum = 0;
  let elected = "";
  for (const validator of validators) {
    if (value > validator.stake + sum) {
      sum += validator.stake;
    } else {
      elected = validator.name;
      break;
    }
  }

  return res.send(elected);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
