const Promise2 = require("../promise");

const p = new Promise2((res, rej) => {rej("a")})

module.exports = {
  deferred() {
    return {
      promise: p,
      resolve: p.resolve.bind(p),
      reject: p.reject.bind(p)
    }
  }
}