const axios = require('axios');
const FormData = require('form-data');

module.exports = {
  config: {
    name: "link",
    usage: "{pn} <media_reply>",
    description: "Get media link",
    category: "utility"
  },
  start: async ({ event, message, cmd, api }) => {
    try {
      const fileId =
        event?.reply_to_message?.photo?.slice(-1)[0]?.file_id ||
        event?.reply_to_message?.video?.file_id ||
        event?.reply_to_message?.animation?.file_id ||
        event?.reply_to_message?.voice?.file_id ||
        event?.reply_to_message?.audio?.file_id ||
        event?.reply_to_message?.document?.file_id ||
        event?.reply_to_message?.sticker?.file_id;

      if (!fileId) return message.Syntax(cmd);

      const { file_size } = await api.getFile(fileId);
      if (file_size > 5 * 1024 * 1024) return message.reply("Payload too large for Telegraph (limit is 5 MB)");

      message.indicator();
      const fileLink = await api.getFileLink(fileId);
      const response = await axios.get(fileLink, { responseType: 'stream' });

      const form = new FormData();
      form.append('file', response.data, 'file');

      const uploadResponse = await axios.post('https://telegra.ph/upload', form, {
        headers: form.getHeaders(),
      });

      if (!uploadResponse.data || uploadResponse.data.length === 0 || !uploadResponse.data[0].src) {
        throw new Error('No valid response from Telegraph API');
      }
      const uploadedImageLink = `https://telegra.ph${uploadResponse[0].src}`;
      await message.reply(uploadedImageLink);
    } catch (error) {
      console.error("Error occurred:", error);
      message.reply(error.message);
    }
  }
};