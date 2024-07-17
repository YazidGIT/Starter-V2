module.exports = {
  config: {
    name: "unsend",
    description: "Delete Bot's message",
    usage: "{pn} <bot_message_reply>",
    category: "utility"
  },
  start: async function({ event, args, message, api, cmd }) {
    try {
      const { id } = await api.getMe();
      if (!event.reply_to_message || event.reply_to_message.from.id !== id) {
        await message.Syntax(cmd);
      } else {
        await api.deleteMessage(event.chat.id, event.reply_to_message.message_id);
      }
    } catch (error) {
      console.log(error);
      await message.reply("Exception Occurred");
    }
  }
};