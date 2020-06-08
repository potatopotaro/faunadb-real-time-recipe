const equal = require("deep-equal");
const { Client, query: q } = require("faunadb");
const {
  Observable,
  interval,
  Subject,
  defer,
  asyncScheduler,
  from,
  of,
} = require("rxjs");
const {
  share,
  delayWhen,
  delay,
  repeat,
  switchMap,
  tap,
  refCount,
  multicast,
} = require("rxjs/operators");
const PASSIVE_FREQUENCY = 3000;
const ACTIVE_FREQUENCY = 1000;

/*
client
  .query(q.Paginate(q.Match(q.Index("all_changes"))))
  .then((res) => console.log(res))
  .catch((err) => console.log(err));
  
client
  .query(q.Paginate(q.Events(q.Collections())))
  .then((res) => console.log(res))
  .catch((err) => console.log(err));
*/

class RealTimeClient extends Client {
  constructor(options, passiveAfter = 10000) {
    super(options);

    this.passiveAfter = passiveAfter;
    this.lastActivityAt = new Date();
  }

  liveQuery(
    expression,
    frequencies = {
      active: 2000,
      passive: 4000,
    }
  ) {
    let prevResult;
    const observable = defer(async () =>
      new Observable((subscriber) => {
        this.query(expression)
          .then((result) => {
            console.log(
              !equal(prevResult, result) ? "UPDATE" : "NO CHANGE",
              prevResult,
              result
            );

            if (!equal(prevResult, result)) {
              console.log(result, prevResult);
              subscriber.next(result);
              prevResult = result;
            }
          })
          .catch((error) => subscriber.next(error))
          .then(() => {
            subscriber.complete();
          });

        return function unsubscribe() {
          subscriber.complete();
        };
      }).pipe(
        delayWhen(() => {
          console.log(frequencies[this.isClientActive ? "active" : "inactive"]);
          return interval(
            frequencies[this.isClientActive ? "active" : "inactive"]
          );
        }),
        repeat()
      )
    );

    return observable.pipe(share());
  }

  livePaginate(
    expression,
    frequencies = {
      active: 2000,
      passive: 4000,
    }
  ) {
    const subject = new Subject();
    const observable = new Observable((subscriber) => {
      (async () => {
        let prevResult;
        let watermark = await this.query(q.ToMicros(q.Now()));
        while (true) {
          try {
            let result = await this.query(
              q.Paginate(expression, {
                after: watermark,
              })
            );
            console.log({ result });
            if (result.data.length) {
              console.log("new watermark");
              watermark = result.data[result.data.length - 1][0] + 1;
              subscriber.next(result);
            }
          } catch (error) {
            subscriber.next(error);
          }
          await new Promise((resolve) => {
            console.log("timeout promise");
            setTimeout(
              resolve,
              frequencies[
                new Date() - this.lastActivityAt < this.passiveAfter
                  ? "active"
                  : "passive"
              ]
            );
          });
        }
      })();
      return function unsubscribe() {
        subscriber.complete();
      };
    });

    /*subject
      .asObservable()
      .pipe(tap((next) => console.log({ next })));*/
    console.log(observable);

    return observable.pipe(share());

    const schedule = defer(
      async () => await this.query(q.ToMicros(q.Now()))
    ).pipe(
      observeOn(asyncScheduler),
      tap((watermark) => {
        console.log({ watermark });
        this.query(
          q.Paginate(expression, {
            after: watermark,
          })
        )
          .then((result) => {
            watermark = result.data[result.data.length - 1][0];
            subscriber.next(result);
          })
          .catch((error) => subscriber.next(error))
          .then(() => {
            subscriber.complete();
          });
        return function unsubscribe() {
          subscriber.complete();
        };
      })
    );

    const oldObservable = defer(
      async () => await this.query(q.ToMicros(q.Now()))
    )
      .pipe(
        tap((watermark) => {
          console.log({ watermark });
          this.query(
            q.Paginate(expression, {
              after: watermark,
            })
          )
            .then((result) => {
              watermark = result.data[result.data.length - 1][0];
              subscriber.next(result);
            })
            .catch((error) => subscriber.next(error))
            .then(() => {
              subscriber.complete();
            });
          return function unsubscribe() {
            subscriber.complete();
          };
        })
      )
      .pipe(
        delayWhen(() => {
          console.log(frequencies[this.isClientActive ? "active" : "inactive"]);
          const isClientActive = new Date() - this.lastActivityAt <= 10000;
          console.log({ isClientActive });
          return interval(
            frequencies[this.isClientActive ? "active" : "inactive"]
          );
        }),
        repeat()
      );

    const _observable = defer(async () => {
      let watermark = await this.query(q.ToMicros(q.Now()));
      return this.isClientActive.asObservable().pipe(
        switchMap((isClientActive) => {
          console.log("WTF?", isClientActive);
          return interval(frequencies[isClientActive ? "active" : "passive"]);
        }),
        tap((subscriber) => {
          this.query(
            q.Paginate(expression, {
              after: watermark,
            })
          )
            .then((result) => {
              watermark = result.data[result.data.length - 1][0];
              subscriber.next(result);
            })
            .catch((error) => subscriber.next(error))
            .then(() => {
              subscriber.complete();
            });
          //if (new Date() - this.lastActivityAt)
          return function unsubscribe() {
            subscriber.complete();
          };
        })
      );
    });
    /*
      .pipe(
      delayWhen(() => {
        console.log(frequencies[this.isClientActive ? "active" : "inactive"]);
        return interval(
          frequencies[this.isClientActive ? "active" : "inactive"]
        );
      }),
      repeat()
    );
    */

    return observable.pipe(share());
  }
}

const realTimeClient = new RealTimeClient({
  secret: "fnADo_TOZNACFK0S_jfu8NhC1NmHuvRPAd3EuNe3",
  timeout: 90000,
});

const liveQuery = realTimeClient.liveQuery(q.Now());
const livePaginate = realTimeClient.livePaginate(
  q.Match(q.Index("all_changes"))
);

/*
liveQuery.subscribe((result, prevResult) => {
  console.log("hello", result, prevResult);
});
*/

livePaginate.subscribe((result) => console.log("result1", result));
livePaginate.subscribe((result) => console.log("result2", result));
