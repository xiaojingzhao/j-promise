const STATUS = {
  PENDING: "pending",
  FULFILLED: "fulfilled",
  REJECTED: "rejected"
};

function isFunction(fn) {
  return fn && typeof fn === "function";
}

function clearTimer(timer) {
  if (timer) {
    clearTimeout(timer);
  }
  return;
}

class PromiseJ {
  constructor(callback) {
    // new PromiseJ((resolve, reject) => {}), callback就是(resolve, reject) => {}
    //一个promsie还应该拥有一个自己的状态，初始值为pending
    this.state = STATUS.PENDING;
    this.nextPromiseQueue = [];
    // fulfilled的时候应该有一个value
    // 在promsie机制中，传进来的回调会被立即执行
    if (isFunction(callback)) {
      callback(this.resolve.bind(this), this.reject.bind(this));
    }
  }

  then(onFulfilled, onRejected) {
    const newPromise = new PromiseJ(() => {});
    if (isFunction(onFulfilled)) {
      newPromise.onFulfilled = onFulfilled;
      if (this.state === STATUS.FULFILLED) {
        queueMicrotask(this._processOnfulfilled.bind(this, newPromise));
      }
    }
    if (isFunction(onRejected)) {
      newPromise.onRejected = onRejected;
      if (
        this.state === STATUS.REJECTED // TODO: 应该设置一个标记
      ) {
        queueMicrotask(this._processOnRejected.bind(this, newPromise));
      }
    }
    this.nextPromiseQueue.push(newPromise);
    // 这里返回promise，让下一个then生成的promise挂到newPromise上
    return newPromise;
  }

  _resolution(promise, x) {
    // 第一种情况 x === promise2
    if (x === promise) {
      promise.reject(new TypeError());
    } else if (x instanceof PromiseJ) {
      // 第二种情况 x 是一个 promise 实例
      if (x.state === STATUS.PENDING) {
        x.nextPromise = promise.nextPromise;
      } else if (x.state === STATUS.REJECTED) {
        if (promise) {
          promise.reject(x.reason);
        } else {
        }
      } else {
        if (promise) {
          promise.resolve(x.value);
        }
      }
    } else if (typeof x === "object" || typeof x === "function") {
      // 第三种情况 x 是一个 object 或者 function
      if (x && x.then) {
        let then;
        try {
          then = x.then;
        } catch (error) {
          promise.reject(error);
        }

        if (isFunction(then)) {
          try {
            then.call(
              x,
              promise.resolve.bind(promise),
              promise.reject.bind(promise)
            );
          } catch (error) {
            if (promise.state !== STATUS.PENDING) {
              promise.reject(error);
            }
          }
        } else {
          promise.resolve(x);
        }
      } else {
        promise.resolve(x);
      }
    } else {
      promise.resolve(x);
    }
  }

  _processOnfulfilled(promise) {
    if (promise && isFunction(promise.onFulfilled)) {
      try {
        const { onFulfilled } = promise;
        let x = onFulfilled(this.value);
        this._resolution(promise, x);
      } catch (e) {
        promise.reject(e);
      }
    } else {
      promise.resolve(this.value);
    }
  }

  _processOnRejected(promise) {
    let handleReject = null;
    if (isFunction(promise.onRejected)) {
      handleReject = promise.onRejected;
    }
    // catch 中传入的
    if (isFunction(promise.errorHandler)) {
      handleReject = promise.errorHandler;
    }
    if (isFunction(handleReject)) {
      try {
        let x = handleReject(this.reason);
        this._resolution(promise, x);
      } catch (e) {
        promise.reject(e);
        // throw e;
      }
    } else {
      promise.reject(this.reason);
    }
  }

  resolve(value) {
    // 只有pending状态可以转变为fullfilled
    if (this.state !== STATUS.PENDING) {
      return;
    }
    this.state = STATUS.FULFILLED;
    // 这里有一个问题，如何保证value不被更改，现在想到的方法是用Object.defineProperty中设置writable
    Object.defineProperty(this, "value", {
      value,
      writable: false
    });
    while (this.nextPromiseQueue.length) {
      const promise = this.nextPromiseQueue.shift();
      queueMicrotask(this._processOnfulfilled.bind(this, promise));
    }
    return this;
  }

  reject(reason) {
    // 只有pending状态可以转变为fullfilled
    // reject 是同步的，那么查询_processOnRejected是异步的嘛？
    // 那么 resolve如果也是这样。代码会变简单嘛？
    if (this.state !== STATUS.PENDING) {
      return;
    }
    this.state = STATUS.REJECTED;
    // 这里有一个问题，如何保证value不被更改，现在想到的方法是用Object.defineProperty中设置writable
    Object.defineProperty(this, "reason", {
      value: reason,
      writable: false
    });

    while (this.nextPromiseQueue.length) {
      const promise = this.nextPromiseQueue.shift();
      queueMicrotask(this._processOnRejected.bind(this, promise));
    }
    return this;
  }

  // catch(errorHandler) {
  //   const newPromise = new PromiseJ(() => {});
  //   this.nextPromiseQueue.push(newPromise);
  //   newPromise.errorHandler = errorHandler;
  //   return newPromise;
  // }

  // finally(handleFinally) {
  //   const newPromise = new PromiseJ(() => {});
  //   this.nextPromiseQueue.push(newPromise);
  //   newPromise.handleFinally = handleFinally;
  //   return newPromise;
  // }
}

module.exports = PromiseJ;
