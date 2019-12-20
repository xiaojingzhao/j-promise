const Promise2 = require("../promise-test");

module.exports = {
  deferred() {
    const p = new Promise2((res, rej) => {});
    return {
      promise: p,
      resolve: p.resolve.bind(p),
      reject: p.reject.bind(p)
    };
  }
};
