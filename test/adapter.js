const Promise2 = require("../promise-test");

const p = new Promise2((res, rej) => {});

module.exports = {
  deferred() {
    return {
      promise: p,
      resolve: p.resolve.bind(p),
      reject: p.reject.bind(p)
    };
  }
};
