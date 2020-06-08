const equal = require("deep-equal");
const { Client, query: q } = require("faunadb");
const dynamicAsyncInterval = require("./DynamicAsyncInterval");
const mitt = require("mitt");
const { v4: uuidv4 } = require("uuid");

class RealTimeClient extends Client {
  constructor(options, passiveAfter = 10000) {
    super(options);

    this.emitter = mitt();
    this.passiveAfter = passiveAfter;
    this.lastActivityAt = new Date();
    this.isClientActive = true;
  }

  markClientAsActive() {
    this.lastActivityAt = new Date();
    this.refreshClientActivity();
  }

  refreshClientActivity() {
    const isClientActive = new Date() - this.lastActivityAt < this.passiveAfter;
    console.log(
      new Date() - this.lastActivityAt,
      this.passiveAfter,
      isClientActive
    );
    if (isClientActive !== this.isClientActive) {
      this.isClientActive = isClientActive;
      this.emitter.emit("isClientActive", isClientActive);
    }
  }

  dynamicPoll(promise, activeMs, passiveMs) {
    const channelId = uuidv4();
    let prevResult;
    const interval = dynamicAsyncInterval(async () => {
      let result;

      try {
        result = await promise();
      } catch (err) {
        result = err;
      }

      if (!equal(result, prevResult)) this.emitter.emit(channelId, result);

      this.refreshClientActivity();
    }, activeMs);

    this.emitter.on("isClientActive", (isClientActive) => {
      console.log("Updating interval for isClientActive", isClientActive);
      interval.reschedule(isClientActive ? activeMs : passiveMs);
    });

    return {
      subscribe: (callback) => {
        this.emitter.on(channelId, callback);
        return () => {
          this.emitter.off(channelId, callback);
        };
      },
    };
  }

  liveQuery(expression, activeMs, passiveMs) {
    const eventId = "liveQuery-" + uuidv4();
    const interval = dynamicAsyncInterval(async () => {
      this.emitter.emit(eventId, "wow!");
      this.refreshClientActivity();
    }, activeMs);

    this.emitter.on("isClientActive", (isClientActive) => {
      console.log("Updating interval for isClientActive", isClientActive);
      interval.reschedule(isClientActive ? activeMs : passiveMs);
    });

    return {
      subscribe: (callback) => {
        this.emitter.on(eventId, callback);
        return () => {
          this.emitter.off(eventId, callback);
        };
      },
    };
  }
}

const realTimeClient = new RealTimeClient({
  secret: "fnADo_TOZNACFK0S_jfu8NhC1NmHuvRPAd3EuNe3",
});

const subscribable = realTimeClient.liveQuery(q.Now(), 5000, 10000);
const unsubscribe = subscribable.subscribe((data) => {
  console.log({ data });
});

setTimeout(() => {
  realTimeClient.markClientAsActive();
}, 15000);
