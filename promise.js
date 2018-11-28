const STATUS = {
  PENDING: "pending",
  FULFILLED: "fulfilled",
  REJECTED: "rejected"
};

function isFunction(fn) {
  return fn && typeof fn === "function";
}

class Promise2 {
  constructor(func1) {
    this.value = null;
    this.state = STATUS.PENDING;
    this.reason = null;
    this.eventQueues = [];
    if (isFunction(func1)) {
      func1(this.resolve.bind(this), this.reject.bind(this));
    }
  }

  then(onFulfilled, onRejected) {
    if(this.state === STATUS.PENDING) {
      this.eventQueues.push({ onFulfilled, onRejected });
      return this;
    }
    if(this.state === STATUS.FULFILLED && isFunction(onFulfilled)) {
      const value = onFulfilled(this.value);
      if(value instanceof Promise2) {
        return value;
      }
      return new Promise(res => res(value))
    }
    if(this.state === STATUS.REJECTED && isFunction(onRejected)) {
      const reason = onRejected(this.reason);
      if(reason instanceof Promise2) {
        return reason;
      }
      return new Promise(res => res(reason))
    }
    return this
  }

  resolve(value) {
    this.value = value;
    this.state = STATUS.FULFILLED;
    while(this.eventQueues.length) {
      const {onFulfilled} = this.eventQueues.shift();
      if(isFunction(onFulfilled)) {
        const val = onFulfilled(value)
        let p = new Promise2(res => res(val));
        if(val instanceof Promise2) {
          p = val
        }
        this.eventQueues.forEach(events => p = p.then(events.onFulfilled, events.onRejected));
        this.eventQueues = []
      }
    }
  }

  reject(reason) {
    this.reason = reason;
    this.state = STATUS.REJECTED;
    // TODO: handle error
    while(this.eventQueues.length) {
      const { onRejected } = this.eventQueues.shift();
      if(isFunction(onRejected)) {
        const val = onRejected(reason)
        let p = new Promise2(res => res(val));
        if(val instanceof Promise2) {
          p = val
        }
        this.eventQueues.forEach(events => p = p.then(events.onFulfilled, events.onRejected));
        this.eventQueues = []
      }
    }
  }

  // TODO:
  catch() {}

  // TODO: 
  finally() {}
}


module.exports = Promise2