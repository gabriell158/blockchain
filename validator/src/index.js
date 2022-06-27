const express = require("express");
const schedule = require("node-schedule");
require("dotenv").config();

const gerenciador = require("./services/gerenciador");

const key = process.env.KEY;

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

app.get("/validate", async (req, res) => {
  let { remetente, recebedor, valor, horario } = req.query;
  remetente = +remetente;
  recebedor = +recebedor;
  valor = +valor;
  horario = new Date(horario);
  const { data: rem } = await gerenciador
    .get(`/cliente/${remetente}`)
    .catch((err) => {
      console.log(err.response ? err.response.statusText : err);
      return { data: undefined };
    });
  if (!rem) return res.status(400).send("Remetente nao encontrado");

  const { qtdMoeda } = rem;
  if (valor > qtdMoeda) {
    return res.status(400).send("Saldo insulficiente");
  }

  if (horario > agora) {
    return res.status(400).send("Horario invalido");
  }

  let { data: transactions } = await gerenciador
    .get("/transacoes")
    .catch((err) => {
      console.error(err);
      return { data: undefined };
    });

  transactions = transactions.filter(
    (transaction) => transaction.remetente === remetente
  );

  transactions.sort((a, b) =>
    new Date(a.horario) > new Date(b.horario) ? -1 : 1
  );

  transactions = transactions.slice(0, 4);

  if (
    new Date(+transactions[0].horario).getTime() >
    agora.getTime() - 5 * 60 * 1000
  ) {
    if (
      transactions.some((transaction) => {
        transaction.status !== 1;
      })
    )
      return res.status(400).send("Problemas nas transacoes recentes");

    if (
      transactions.every(
        (transaction) =>
          transaction.recebedor === transactions[0].recebedor &&
          transaction.value === transactions[0].value
      )
    )
      return res.status(400).send("Transacoes recentes duplicadas");
  }

  return res.send(key);
});

const port = 8000;

if (key) {
  app.listen(port, () => {
    console.log(`App listening on port ${port}`);
  });
} else {
  console.error("Sem chave do seletor");
  process.exit();
}
