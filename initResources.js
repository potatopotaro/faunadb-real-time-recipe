const { Client, query: q } = require("faunadb");

const client = new Client({
  secret: "fnADo_TOZNACFK0S_jfu8NhC1NmHuvRPAd3EuNe3",
});

const createAllEventsIndex = () =>
  client
    .query(
      q.CreateIndex({
        name: "all_changes_by_ref",
        source: [
          {
            collection: q.Collection("users"),
          },
          {
            collection: q.Collection("posts"),
          },
        ],
        values: [{ field: ["ref"] }, { field: ["ts"] }],
      })
    )
    .then((res) => console.log(res))
    .catch((err) => console.log(err));

createAllEventsIndex();
