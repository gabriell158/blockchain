const express = require("express");
const { Validator } = require("./database/mongodb");
const { getRandomInt } = require("./provider/random");

const app = express();

const port = 3000;

app.use(express.json());

app.get("/", (req, res) => res.send("hello world"));

app.post("/validator", async (req, res) => {
  const { name, ip, stake = 0 } = req.body;

  return res.send(await Validator.create({ name, ip, stake }));
});

app.get("/validator", async (req, res) => {
  return res.send(await Validator.find({}));
});

app.get("/validator/:id", async (req, res) => {
  const { id } = req.params;
  return res.send(await Validator.find({ _id: id }));
});

app.put("/validator/:id", async (req, res) => {
  const { id } = req.params;
  const { name, ip, stake } = req.body;
  return res.send(await Validator.updateOne({ _id: id }, { name, ip, stake }));
});

app.delete("/validator/:id", async (req, res) => {
  const { id } = req.params;
  return res.send(await Validator.deleteOne({ _id: id }));
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
