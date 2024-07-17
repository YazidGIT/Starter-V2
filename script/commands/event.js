const fs = require("fs");
const axios = require("axios");
const path = require("path");
const renamedPath = path.resolve("script", "events");
const prettier = require("prettier");

function fileExists(filename) {
  return fs.existsSync(path.join(__dirname, filename));
}

async function formatsave(filename, link) {
  try {
    global.events.delete(filename);
    const response = await axios.get(link);
    let jsCode = response.data;
    jsCode = await prettier.format(jsCode, { parser: "babel", semi: true, singleQuote: true });
    const filePath = path.join(renamedPath, filename);
    fs.writeFileSync(filePath, jsCode, "utf8");
    const requiredCode = require(filePath);
    if (!requiredCode.start) throw new Error("File Doesn't have start function set");
    global.events.set(filename, requiredCode);
  } catch (error) {
    throw error;
  }
}
module.exports = {
  config: {
    name: "event",
    description: "Event Panel",
    role: 2,
    usage: "{pn} load cmd\n{pn} unload event",
    category: "system"
  },
  start: async function({ event, args, api, message, cmd }) {
    if (!args[0]) return message.Syntax(cmd);

    try {
      switch (args[0]) {
        case "load":
          if (!args[1]) return message.Syntax(cmd);
          const loadFilename = args[1] + ".js";
          if (!fileExists(loadFilename)) throw new Error("File doesn't exist.");

          const command = require(path.join(renamedPath, loadFilename));
          const commandName = command.config.name;

          if (global.config_handler.skip.events.includes(commandName)) {
            const index = global.config_handler.skip.events.indexOf(commandName);
            global.config_handler.skip.events.splice(index, 1);
            global.utils.configSync({
              skip: {
                ...global.config_handler.skip,
                events: global.config_handler.skip.events
              }
            });
          }
          global.events.set(loadFilename, command);
          message.reply(`Event ${commandName} loaded successfully.`);
          break;

        case "unload":
          if (!args[1]) return message.Syntax(cmd);
          const unloadFilename = args[1] + ".js";
          if (!fileExists(unloadFilename)) throw new Error("File doesn't exist.");

          const commandUnload = require(path.join(renamedPath, unloadFilename));
          const commandNameUnload = commandUnload.config.name;

          if (!global.config_handler.skip.events.includes(commandNameUnload)) {
            global.config_handler.skip.events.push(commandNameUnload);
            global.utils.configSync({
              skip: {
                ...global.config_handler.skip,
                events: global.config_handler.skip.events
              }
            });
          }
          global.events.delete(unloadFilename);
          message.reply(`Unloaded ${commandNameUnload} successfully.`);
          break;
        case 'install':
          if (!args[1] || !args[1].endsWith(".js")) return message.reply("Include File name with format");
          if (!args[2]) return message.reply("Include a valid raw link");
          await message.indicator().then(async () => {
            const sent = await message.reply(!fileExists(args[1]) ? `${args[1]} Already Exists` : "Confirm Your Choice", {
              reply_markup: {
                inline_keyboard: [[{ text: "Confirm", callback_data: "confirm" }, { text: "Cancel", callback_data: "cancel" }]]
              }
            });
            global.bot.callback_query.set(sent.message_id, {
              cmd,
              author: event.from.id,
              link: args[2]?.startsWith("http") ? args[2] : event.text,
              isText: args[2].startsWith("http"),
              file: args[1],
              ctx: sent,
              messageID: sent.message_id,
              chat: event.chat.id
            });
          }).catch((e) => {
            throw e;
          });
          break;
        default:
          message.Syntax(cmd);
          break;
      }
    } catch (err) {
      message.reply(err.message);
    }
  },
  callback_query: async function({ event, message, api, ctx, Context, cmd }) {
    try {
      const { link, file, author, messageID, chat } = Context;
      await api.answerCallbackQuery({ callback_query_id: ctx.id });
      if (author != ctx.from.id) return message.send("Unauthorized");
      const { data } = ctx;
      switch (data) {
        case "confirm":
          await message.edit("Confirmed", messageID, chat, { reply_markup: { inline_keyboard: [] } });
          await formatsave(file, link);
          message.edit(`Downloaded and acquired ${file} successfully, Restart recommended`, messageID, chat);
          break;
        case "cancel":
          await message.edit("Cancelled", messageID, chat, { reply_markup: { inline_keyboard: [] } });
          break;
        default:
          message.Syntax(cmd);
      }
    } catch (err) {
      message.edit("Exception: " + err.message, messageID, chat);
    }
  }
}