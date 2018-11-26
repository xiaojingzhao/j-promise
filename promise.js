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
    this.reason = this.reason;
    this.eventQueues = [];
    if (isFunction(func1)) {
      func1(this.resolve.bind(this), this.reject.bind(this));
    }
  }

  /**
   *  可以多次调用, 立即调用，非异步。
   * @param {Function} onFulFilled 只调用一次
   * @param {Function} onRejected 只调用一次
   * @return {Promise2}
   */
  then(onFulFilled, onRejected) {
    try {
      this.eventQueues.push({ onFulFilled, onRejected });
      return this;
    } catch (error) {
      if (this.errHandler) {
        this.errHandler(error);
        return
      }
      throw error
    }
  }

  catch(errHandler) {
    this.errHandler = errHandler;
  }

  finally() {}

  /**
   * 只调用一次
   */ 
  resolve(value) {
    if (this.state === STATUS.PENDING) {
      this.value = value;
      this.state = STATUS.PENDING;
    }
    while (this.eventQueues.length > 0) {
      const { onFulFilled } = this.eventQueues.shift();
      const value = onFulFilled(this.value);
      if (value instanceof Promise2) {
        this.eventQueues.forEach(({ onFulFilled, onRejected }) => {
          value.then(onFulFilled, onRejected);
        });
        this.eventQueues = [];
      }
    }
  }

  /**
   * 只调用一次
   * 返回一个新的promise
   */
  reject(reason) {
    if (this.state === STATUS.PENDING) {
      this.reason = reason;
      this.state = STATUS.REJECTED;
    }
    while (this.eventQueues.length > 0) {
      const { onRejected } = this.eventQueues.shift();
      let result;
      if(isFunction(onRejected)) {
        result = onRejected(reason)
      }
      if(result instanceof Promise2) {
        this.eventQueues.forEach(({ onFulFilled, onRejected }) => {
          value.then(onFulFilled, onRejected);
        });
      } else {
        const promise = () => new Promise(resolve => resolve(result))
        this.eventQueues.forEach(({ onFulFilled, onRejected }) => {
          promise.then(onFulFilled, onRejected);
        });
        this.eventQueues = []
      }
    }
  }
}

module.exports = Promise2;
