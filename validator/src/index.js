const express = require("express");
const schedule = require("node-schedule");

const gerenciador = require("./services/gerenciador");
const seletor = require("./services/seletor");

const key = "";

const agora = new Date();

schedule.scheduleJob("*/5 * * * * *", async () => {
  const { data: hora } = await gerenciador.get("/hora").catch((err) => {
    console.error(err);
    return { data: undefined };
  });
  if (hora) {
    agora.setTime(new Date(hora));
    // console.log(agora);
  }
});

const app = express();

const port = 8000;

app.use(express.json());

app.get("/", (req, res) => res.send("hello world"));

app.get("/validate", async (req, res) => {
  let { id, remetente, recebedor, valor, horario } = req.query;
  id = +id;
  remetente = +remetente;
  recebedor = +recebedor;
  valor = +valor;
  horario = new Date(horario);
  const { data: rem } = await gerenciador
    .get(`/cliente/${remetente}`)
    .catch((err) => {
      console.log(err);
      return { data: undefined };
    });

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

  transactions.sort();

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

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
