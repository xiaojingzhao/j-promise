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
    newPromise.onFulfilled = onFulfilled;
    newPromise.onRejected = onRejected;

    if (this.state === STATUS.FULFILLED) {
      queueMicrotask(this._processOnfulfilled.bind(this, newPromise));
    }
    if (this.state === STATUS.REJECTED) {
      queueMicrotask(this._processOnRejected.bind(this, newPromise));
    }
    if (this.state === STATUS.PENDING) {
      this.nextPromiseQueue.push(newPromise);
    }

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
        x.then(
          value => promise._fulfillPromise(value),
          reason => promise.reject(reason)
        );
      } else if (x.state === STATUS.REJECTED) {
        promise.reject(x.reason);
      } else {
        promise._fulfillPromise(x.value);
      }
    } else if ((x && typeof x === "object") || typeof x === "function") {
      // 第三种情况 x 是一个 object 或者 function
      let then;
      try {
        then = x.then;
      } catch (error) {
        promise.reject(error);
      }

      if (isFunction(then)) {
        let invokeCount = 0;
        try {
          then.call(
            x,
            value => {
              invokeCount++;
              if (invokeCount === 1) {
                promise.resolve.call(promise, value);
              }
            },
            promise.reject.bind(promise)
          );
        } catch (error) {
          if (invokeCount === 1) {
            // 抛出错误在 resolvePromise或者rejecPromise之后，忽略
          } else if (promise.state === STATUS.PENDING) {
            promise.reject(error);
          }
        }
      } else {
        promise._fulfillPromise(x);
      }
    } else {
      promise._fulfillPromise(x);
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

  _fulfillPromise(value) {
    this.state = STATUS.FULFILLED;
    // 这里有一个问题，如何保证value不被更改，现在想到的方法是用Object.defineProperty中设置writable
    Object.defineProperty(this, "value", {
      value,
      writable: false
    });
    queueMicrotask(() => {
      while (this.nextPromiseQueue.length) {
        const promise = this.nextPromiseQueue.shift();
        this._processOnfulfilled(promise);
      }
    });
  }

  resolve(value) {
    // 只有pending状态可以转变为fullfilled
    if (this.state !== STATUS.PENDING) {
      return;
    }
    this._resolution(this, value);
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

    queueMicrotask(() => {
      while (this.nextPromiseQueue.length) {
        const promise = this.nextPromiseQueue.shift();
        this._processOnRejected(promise);
      }
    });

    return this;
  }

  // 不是 promise A+ 标准
  // catch(errorHandler) {
  //   const newPromise = new PromiseJ(() => {});
  //   this.nextPromiseQueue.push(newPromise);
  //   newPromise.errorHandler = errorHandler;
  //   return newPromise;
  // }

  // 不是 promise A+ 标准
  // finally(handleFinally) {
  //   const newPromise = new PromiseJ(() => {});
  //   this.nextPromiseQueue.push(newPromise);
  //   newPromise.handleFinally = handleFinally;
  //   return newPromise;
  // }
}

module.exports = PromiseJ;
