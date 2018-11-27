const STATUS = {
  PENDING: "pending",
  FULFILLED: "fulfilled",
  REJECTED: "rejected"
};

function isFunction(fn) {
  return fn && typeof fn === "function";
}

function resolutionProcedure(promise, x) {

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

  resolutionProcedure(x) {
    if(x instanceof Promise2) {
      return x
    }
    return new Promise2(res => res(x))
  }

  /**
   *  可以多次调用, 立即调用，非异步。
   * @param {Function} onFulFilled 只调用一次
   * @param {Function} onRejected 只调用一次
   * @return {Promise2}
   */
  then(onFulFilled, onRejected) {
    try {
      if (this.state === STATUS.PENDING) {
        this.eventQueues.push({ onFulFilled, onRejected });
        return this;
      } else if (this.state === STATUS.FULFILLED) {
        if (!isFunction(onFulFilled)) {
          return this;
        }
        const value  = onFulFilled(this.value);
        // TODO: [[Resolve]](promise2, x)
        return this.resolutionProcedure(value);
      } else {
        if (!isFunction(onRejected)) {
          return this;
        }
        const reason  = onRejected(this.reason);
        // TODO: [[Resolve]](promise2, x)
        return this.resolutionProcedure(value);
      }
    } catch (error) {
      if (this.errHandler) {
        this.errHandler(error);
        return;
      }
      throw error;
    }
  }

  catch(errHandler) {
    this.errHandler = errHandler;
  }

  finally() {}

  /**
   * 只调用一次
   * 如果不在异步 如 settimeout 中调用 resolve 方法，那么将会出现没有 this.eventQueues的情况
   * 如果是在异步函数中调用，那么then方法会将 this.eventQueus 的队列填满
   */

  resolve(value) {
    if (this.state === STATUS.PENDING) {
      this.value = value;
      this.state = STATUS.PENDING;
    }
    // TODO: 如何知道这个是发生在异步函数中的？需要知道吗？
    while (this.eventQueues.length > 0) {
      const { onFulFilled } = this.eventQueues.shift();
      const value = onFulFilled(this.value);
      if (value instanceof Promise2) {
        this.eventQueues.forEach(({ onFulFilled, onRejected }) => {
          value.then(onFulFilled, onRejected);
        });
        return;
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
    // TODO: 如何知道这个是发生在异步函数中的？需要知道吗？
    // 如果在异步中发生， this.eventQueues 的长度不为 0
    // 如果是同步发生的，会执行 resolution procedure， this.eventQueues 长度可能为0，可能不为0
    while (this.eventQueues.length > 0) {
      const { onRejected } = this.eventQueues.shift();
      let result;
      if (isFunction(onRejected)) {
        result = onRejected(reason);
      }
      if (result instanceof Promise2) {
        this.eventQueues.forEach(({ onFulFilled, onRejected }) => {
          value.then(onFulFilled, onRejected);
        });
      } else {
        const promise = new Promise2(resolve => resolve(result));
        this.eventQueues.forEach(({ onFulFilled, onRejected }) => {
          promise.then(onFulFilled, onRejected);
        });
        this.eventQueues = [];
      }
    }
  }
}

var a = new Promise2((res, rej) => {
  setTimeout(() => {
    console.log("1234");
    rej(1234);
  }, 1000);
});

a.then(
  value => console.log("first then resolve", value),
  reason => console.log("first then reject", reason)
)
  .then(
    value => {
      console.log("second then resolve", value);
      return new Promise2((resolve, rej) => resolve("rej test"));
    },
    reason => console.log("second then reject", reason)
  )
  .then(
    value => console.log("third then resolve", value),
    reason => console.log("third then reject", reason)
  );
