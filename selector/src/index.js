const express = require("express");
const { scheduleJob } = require("node-schedule");
const axios = require("axios");

require("dotenv").config();

const { Validator } = require("./database/mongodb");
const { getRandomInt } = require("./providers/random");
const gerenciador = require("./services/gerenciador");

const agora = new Date();

scheduleJob("*/5 * * * * *", async () => {
  const { data: hora } = await gerenciador.get("/hora").catch((err) => {
    console.error("Não foi possível sincronizar com o gerenciador");
    return { data: undefined };
  });
  if (hora) {
    // console.log(hora);
    agora.setTime(new Date(hora));
  }
});

const app = express();

app.use(express.json());

app.get("/", (req, res) => res.send("documentacao"));

app.post("/validator", async (req, res) => {
  const { name, ip, stake = 0 } = req.body;

  return res.send(
    await Validator.create({ name, ip, stake }).catch(
      () => "Falha ao cadastrar o validador"
    )
  );
});

app.get("/validator", async (req, res) => {
  return res.send(
    await Validator.find({}).catch(() => "Falha ao listar os validadores")
  );
});

app.get("/validator/:id", async (req, res) => {
  const { id } = req.params;
  return res.send(
    await Validator.find({ _id: id }).catch(() => "Falha ao listar o validador")
  );
});

app.put("/validator/:id", async (req, res) => {
  const { id } = req.params;
  const { name, ip, stake } = req.body;
  return res.send(
    await Validator.updateOne({ _id: id }, { name, ip, stake }).catch(
      () => "Falha ao atualizar o validador"
    )
  );
});

app.delete("/validator/:id", async (req, res) => {
  const { id } = req.params;
  return res
    .send(await Validator.deleteOne({ _id: id }))
    .catch((err) => "Falha ao apagar o validador");
});

app.get("/validate", async (req, res) => {
  const { remetente, recebedor, valor, horario } = req.query;
  if (!remetente || !recebedor || !valor || !horario) {
    return res.send(
      "remetente, recebedor, valor e horario precisam ser fornecidos"
    );
  }
  const validators = await Validator.find().catch(() => []);
  if (!validators.length) {
    return res
      .status(400)
      .send(
        "Falha ao buscar validadores no banco de dados. Tente novamente mais tarde"
      );
  }
  let sum = 0;
  for (const validator of validators) {
    sum += validator.stake;
  }
  // sum = validators.reduce((total, value) => total.stake + value.stake);
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

  if (!elected)
    return res.status(400).send("Não foi possível encontrar um validador");
  const api = axios.create({
    baseURL: "http://" + elected.ip + "/",
  });

  const { data: key } = await api
    .get(
      `/validate?remetente=${remetente}&recebedor=${recebedor}&valor=${valor}&horario=${horario}`
    )
    .catch(() => {
      console.error("Não foi possível validar a transação");
      return {};
    });
  if (key) {
    if (key === elected._id.toString()) return res.send("Transação aprovada");
    return res.status(400).send("Chave do validador invalida");
  }
  res.status(400).send("Transacao nao aprovada");
});

const port = 3000;

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
