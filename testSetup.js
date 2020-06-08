const poller = new Poller(q.Index("all_upserts"), relationships);

// cook - confirm meal succesfully created
// cook & customer - notify order created for meal
// cook & customers - remind pickup soon
// cook & customers - pickup is now
// cook & customer - pickup for meal completed
// cook & customer - pickup for meal missed
// customer - leave a review
// cook - new review

const NewDoc = {};

const Dependencies = q.Collection("Dependencies");
const SearchDependencies = (ref) =>
  q.Match(q.Index("search_dependencies"), ref);

const putOrGetDependencies = (doc) => {
  // search dependencies collection for doc
  // if no reference exists,
};

q.Create(q.Collection("relationships"), {
  data: {
    doc: 'Ref(Collection("users"), "265939813418402324")',
    has: [
      'Ref(Collection("posts"), "265939813418402324")',
      'Ref(Collection("posts"), "265939813418402324")',
    ],
  },
});

q.CreateIndex({
  name: "related_docs_by_doc",
  source: [
    {
      collection: q.Collection("users"),
      fields: {
        doc: q.Query(q.Lambda((user) => q.Select("ref", user))),
        has: q.Query(
          q.Lambda((user) =>
            q.Let(
              {
                meals: q.Select(["data", "meals"], user, []),
                orders: q.Select(["data", "orders"], user, []),
              },
              q.Concat(q.Var("meals"), q.Var("orders"))
            )
          )
        ),
      },
    },
  ],
});

// 1 cook has N meals
// 1 meal has N orders
// 1 order has N meals
// 1 customer has N orders
