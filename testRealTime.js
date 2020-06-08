const Chance = require("chance");
const { Client, query: q } = require("faunadb");
const FREQUENCY = 1000;

const client = new Client({
  secret: "fnADo_TOZNACFK0S_jfu8NhC1NmHuvRPAd3EuNe3",
});

const chance = new Chance();

setInterval(() => {
  client
    .query(
      q.Create(q.Collection("users"), {
        data: {
          name: chance.name(),
        },
      })
    )
    .then((res) => console.log(res))
    .catch((err) => console.log(err));
}, FREQUENCY * 2);

setInterval(() => {
  client
    .query(
      q.Create(q.Collection("posts"), {
        data: {
          title: `${chance.word()} ${chance.word()} ${chance.word()}`,
        },
      })
    )
    .then((res) => console.log(res))
    .catch((err) => console.log(err));
}, FREQUENCY);
