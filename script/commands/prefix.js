module.exports = {
  config: {
    name: "prefix",
    description: "Change Bot's prefix for certain groups",
    usage: "{pn} set|global <prefix_symbol>",
    category: "utility"
  },
  start: async function({ event, args, globalsData, threadsData, message, cmd, role }) {
    try {
      if (event.chat.type !== "private") {
        if (role !== 1 || role !== 2) return message.reply("You Must be Thread Admin")
      }
      switch (args?.[0]) {
        case 'set':
          if (!args[1]) return message.reply("Provide Prefix after 'set'");
          if (args[1].length > 1) return message.reply('Prefix can only be one character long')
          await threadsData.update(event.chat.id, { prefix: args[1].toString() });
          return message.reply(`Changed thread prefix to "${args[1]}"`);

        case 'global':
          if (!args[1]) return message.reply("Provide Prefix after 'global'");
          if (args[1].length > 1) return message.reply('Prefix can only be one character long')
          await globalsData.update('prefix', args[1]);
          return message.reply(`Changed global prefix to "${args[1]}"`);

        default:
          message.Syntax(cmd);
      }
    } catch (error) {
      console.log(error);
      message.reply(error.message);
    }
  },
  chat: async function({ event, args, globalsData, threadsData, message }) {
    if (event?.text && event?.text.toLowerCase() === "prefix") {
      const globalPrefix = await globalsData.retrieve('prefix') || config?.BOT?.prefix || "/";
      const prefixThread = (await threadsData.retrieve(event.chat.id))?.prefix || globalPrefix;
      const prefixText = `
Global prefix: *${globalPrefix}*
Chat prefix: *${prefixThread}*
`;
      return message.reply(prefixText, { parse_mode: "Markdown" });
    }
    return null
  }
};