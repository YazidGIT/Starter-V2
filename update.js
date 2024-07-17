process.emitWarning = function(warning, type) {
  if (type !== 'DeprecationWarning') {
    console.warn(warning);
  }
};

require("./starter");
const fs = require('fs');
const EventEmitter = require('events');
const eventEmitter = new EventEmitter();
const bot = require('./handler/login.js');
let log = global.log;

const token = global.config.BOT['token'];
if (!token) {
  eventEmitter.emit('critical_error', "Token Not Provided");
}

if (!global.cmds) global.cmds = new Map();

try {
  require("./script/command_loader");
} catch (error) {
  eventEmitter.emit('critical_error', "Failed to load Command Loader: " + error.message);
}

let commandFiles = [];
try {
  commandFiles = fs.readdirSync("script/commands").filter(file => file.endsWith(".js"));
} catch (error) {
  eventEmitter.emit('critical_error', "Failed to read command files: " + error.message);
}

const commandsArray = commandFiles.map(file => {
  try {
    const command = require(`./script/commands/${file}`);
    if (global.cmds.has(file)) {
      const { name, description } = command.config;
      if (!name) return
      return {
        command: name,
        description: description?.short || description?.long || (typeof description === 'string' ? description : 'Not Available')
      };
    } else {
      log(`Command ${file} is not registered in global.cmds`, 'yellow', false);
      return null;
    }
  } catch (error) {
    log(`Exception while loading ${file} : ${error.message}`)
  }
}).filter(cmd => cmd !== null);

bot.setMyCommands(commandsArray).then(() => {
  log("Updated", "green", true);
  process.exit(0)
}).catch(error => {
  eventEmitter.emit('critical_error', "Failed to set Commands: " + error.message);
});