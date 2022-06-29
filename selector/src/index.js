const express = require("express");
const schedule = require("node-schedule");
const axios = require("axios");

require("dotenv").config();

const { Validator } = require("./database/mongodb");
const { getRandomInt } = require("./provider/random");
const gerenciador = require("./services/gerenciador");

const agora = new Date();

schedule.scheduleJob("*/5 * * * * *", async () => {
  const { data: hora } = await gerenciador.get("/hora").catch((err) => {
    console.error(err.response ? err.response.statusText : err);
    return { data: undefined };
  });
  if (hora) {
    agora.setTime(new Date(hora));
  }
});

const app = express();

app.use(express.json());

app.get("/", (req, res) => res.send("documentacao"));

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

app.get("/validate", async (req, res) => {
  const { remetente, recebedor, valor, horario } = req.query;
  if (!remetente || !recebedor || !valor || !horario) {
    return res.send(
      "remetente, recebedor, valor e horario precisam ser fornecidos"
    );
  }
  const validators = await Validator.find();
  let sum = 0;
  for (const validator of validators) {
    sum += validator.stake;
  }
  let value = getRandomInt(0, sum);
  sum = 0;
  let elected;
  for (const validator of validators) {
    if (value > validator.stake + sum) {
      sum += validator.stake;
    } else {
      elected = validator;
      break;
    }
  }

  const api = axios.create({
    baseURL: "http://" + elected.ip + "/",
  });

  const { data: key } = await api
    .get(
      `/validate?remetente=${remetente}&recebedor=${recebedor}&valor=${valor}&horario=${horario}`
    )
    .catch((err) => {
      console.error(err.response ? err.response.statusText : err);
      return {};
    });
  if (key) {
    if (key === elected._id.toString()) return res.send("Trancasao aprovada");
    return res.status(400).send("Chave do validador invalida");
  }
  res.status(400).send("Transacao nao aprovada");
});

const port = 3000;

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
