const { execSync } = require('child_process');
const path = require("path");
const { readdirSync } = require("fs");
const kleur = require("kleur");

let errors = 0;
let loadedCommands = 0;
let loadedEvents = 0;
const failedCommands = [];
const failedEvents = [];

const commandNames = new Set();
const eventNames = new Set();
global.cmds = new Map();
global.events = new Map();

const log = (text, color, bold = false) => {
  let message = kleur[color](text);
  if (bold) message = message.bold();
  console.log(message);
};

const validateItemConfig = (item, type, filePath) => {
  if (!item.config || !item.config.name) throw new Error("config and/or config.name not set");
  if (!item.start || typeof item.start !== "function") throw new Error("start function not set or not a function");

  item.config.path = filePath;

  if (type === "commands") {
    if (commandNames.has(item.config.name)) throw new Error(`${item.config.name} already exists`);

    if (item.config.aliases) {
      if (!Array.isArray(item.config.aliases)) throw new Error("aliases must be an array");

      const aliases = item.config.aliases.filter(alias => alias.length > 0);
      if (aliases.some(alias => commandNames.has(alias))) throw new Error(`${[item.config.name, ...aliases].join(", ")} already exists in other files`);

      aliases.forEach(alias => commandNames.add(alias));
    }

    commandNames.add(item.config.name);
  } else if (type === "events") {
    if (eventNames.has(item.config.name)) throw new Error(`${item.config.name} already exists`);
    eventNames.add(item.config.name);
  }
};

const installModule = (mod) => {
  try {
    execSync(`npm install ${mod}`, { stdio: 'inherit' });
    log(`Successfully installed ${mod}`, 'green');
    return true;
  } catch (err) {
    log(`Failed to install ${mod}: ${err.message}`, 'red', true);
    return false;
  }
};

const getMissingModule = (err) => {
  const match = err.message.match(/Cannot find module '([^']+)'/);
  return match ? match[1] : null;
};

const requireWithModuleCheck = (filePath, type) => {
  try {
    return require(filePath);
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      const missingModule = getMissingModule(err);
      if (missingModule) {
        log(`Installing npm: "${missingModule}"`, 'red');
        if (installModule(missingModule)) {
          return require(filePath);
        }
      }
    }
    log(`An error occurred while loading ${type}: ${err.message}`, 'red', true);
    return null;
  }
};

const loadFiles = async (files, basePath, type) => {
  log(`Loading ${type}...`, 'yellow');

  for (let file of files) {
    const filePath = path.join(basePath, file);
    const item = requireWithModuleCheck(filePath, type);

    if (!item) {
      errors++;
      if (type === "commands") failedCommands.push(file);
      else failedEvents.push(file);
      log(`'${file}': Failed to load ${type}`, 'red', true);
      continue;
    }

    try {
      if (global.config_handler?.skip?.[type]?.includes(item?.config?.name)) {
        if (type === "commands" && global.cmds.has(item?.config?.name)) continue;
        if (type === "events" && global.events.has(file)) continue;
      }

      validateItemConfig(item, type, filePath);

      if (type === "commands") {
        global.cmds.set(file, item);
        loadedCommands++;
      } else {
        global.events.set(file, item);
        loadedEvents++;
      }
    } catch (error) {
      errors++;
      if (type === "commands") failedCommands.push(file);
      else failedEvents.push(file);

      log(`'${file}': ${error.message}`, 'red', true);
    } finally {
      process.stdout.cursorTo(0);
      process.stdout.write(`Loaded ${type === "commands" ? loadedCommands : loadedEvents} ${type}`);
    }
  }

  process.stdout.write("\n");
  process.stdout.clearLine();
  log(`${type.charAt(0).toUpperCase() + type.slice(1)} Loaded: ${type === "commands" ? loadedCommands : loadedEvents}`, 'blue');
};

const loadAll = async () => {
  const commandsPath = path.join(__dirname, "commands");
  const commandFiles = (readdirSync(commandsPath)).filter(v => v.endsWith(".js"));
  await loadFiles(commandFiles, commandsPath, "commands");

  const eventsPath = path.join(__dirname, "events");
  const eventFiles = (readdirSync(eventsPath)).filter(v => v.endsWith(".js"));
  await loadFiles(eventFiles, eventsPath, "events");
};

loadAll().then(() => {
  log(`Errors: ${errors}`, 'red');

  if (failedCommands.length > 0) {
    log(`Failed to load commands: ${failedCommands.join(", ")}`, 'red');
  }

  if (failedEvents.length > 0) {
    log(`Failed to load events: ${failedEvents.join(", ")}`, 'red');
  }
});