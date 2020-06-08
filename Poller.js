class Poller {
  constructor() {}
}

const poller = new Poller();

// counts events in a window of time
// Count(Difference(At(Now(), Events(Collections())), At(TimeSubtract(Now(), 1, "day"), Events(Collections()))))

const CountUpserts = q.Count(q.Match(q.Index("all_changes")));

const pollCallback = () => {
  const numberOfChanges = 200000; // CountUpserts
  const moduloValue = numberOfChanges / 1000;
};

const lambdaExecutionHandler = () => {};

const getRelevantDocs = (id, batchModulo) => {
  id & batchModulo;
};
