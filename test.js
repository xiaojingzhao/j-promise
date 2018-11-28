const Promise2 = require("./promise");

// TODO: more test case 
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
      return new Promise2((resolve, rej) => resolve("res test"));
    },
    reason => console.log("second then reject", reason)
  )
  .then(
    value => {
      console.log("third then resolve", value);
      return new Promise2((resolve, rej) => rej("rej test"));
    },
    reason => console.log("third then reject", reason)
  )
  .then(
    value => console.log("fourth then resolve", value),
    reason => console.log("fourth then reject", reason)
  );
