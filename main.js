process.emitWarning = (warning, type) => {
  if (type !== 'DeprecationWarning') {
    console.warn(warning);
  }
};

process.on('uncaughtException', (err) => {
  console.log(`Uncaught Exception: ${err.message}\n${err.stack}`, "red");
});

process.on('unhandledRejection', (reason) => {
  if (reason instanceof Error) {
    console.log(`Unhandled Rejection: ${reason.message}\n${reason.stack}`, "red");
  } else {
    console.log(`Unhandled Rejection: ${reason}`, "red");
  }
});
const { existsSync } = require("fs");

const config = require("./config.json");
require("./starter");
const log = global?.log;
const run_sqlite = require("./Database/SQLite/global.js");
const run_mongo = require("./Database/MongoDB/global.js");
require("./handler/events.js");

log("Starting Bot");

require("./script/command_loader")

if (config.DATABASE.mongodb["CONNECT_MONGODB"]) {
  if (config.DATABASE.sqlite['CONNECT_SQLITE']) {
    log("CHOOSE ONLY ONE DATABASE. \nSELECTED MONGODB WITH SQLITE", "red", true)
    process.exit(2)
  }
  if (!config.DATABASE.mongodb["MONGO_URI"]) {
    log("Provide MONGO_URI", "red", true)
    process.exit(2)
  }
  run_mongo();
}

if (config.DATABASE.sqlite['CONNECT_SQLITE']) {
  if (config.DATABASE.mongodb["CONNECT_MONGODB"]) {
    log("CHOOSE ONLY ONE DATABASE. \nSELECTED SQLITE WITH MONGODB", "red", true)
    process.exit(2)
  }
  run_sqlite();
}

require("./handler/handler.js");

if (config?.server?.toggle && config?.server?.port) {
  log("Starting Express Server", "green");
  try {
    require("./server/index.js");
  } catch (err) {
    log("Failed to start server", "red", true);
    log(err.message, "red");
  }
}

log("Logged into Bot", "cyan", true);
