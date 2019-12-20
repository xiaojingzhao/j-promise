var fs = require("fs");
var path = require("path");
var promisesAplusTests = require("promises-aplus-tests");
var adapter = require("./adapter");

const COVER_PATH = path.join(process.cwd(), "..", "/coverage/index.log");

try {
  promisesAplusTests(adapter, function(err) {
    fs.writeFile(COVER_PATH, JSON.stringify(err));
  });
} catch (error) {
  console.log(error);
}
