function main() {
  const exports = require("./manager");
  global.mongo = {
    usersData: {},
    threadsData: {},
    globalsData: {}
  };
  for (let usersData of Object.keys(exports.usersData)) {
    global.mongo.usersData[usersData] = exports.usersData[usersData];
  }
  for (let threadsData of Object.keys(exports.threadsData)) {
    global.mongo.threadsData[threadsData] = exports.threadsData[threadsData];
  }
  for (let globalsData of Object.keys(exports.globalsData)) {
    global.mongo.globalsData[globalsData] = exports.globalsData[globalsData];
  }

  global.log("Loaded MongoDB", "gray");
}

module.exports = main;