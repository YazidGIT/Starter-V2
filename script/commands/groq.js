const axios = require("axios");
const maxStorageMessage = 10;

global.tmp.groq = global.tmp?.groq || {};
global.tmp.groq.history = global.tmp.groq.history || {};

const { history } = global.tmp.groq;

module.exports = {
  config: {
    name: "ai",
    usage: "Either talk in chat with groq enabled in config or do '{pn} Hello World'",
    description: "Talk to AI models from Groq",
    category: "ai"
  },

  start: async function({ api, args, message, event }) {
    if (!history[event.from.id]) {
      history[event.from.id] = [];
    }
    if (!args[0]) {
      return message.reply("Include a prompt.");
    }
    switch (args[0].toLowerCase()) {
      case 'clear': {
        history[event.from.id] = [];
        return message.reply("Started a new session");
      }
      default: {
        const prompt = args.join(" ");
        try {
          history[event.from.id].push({ role: 'user', content: prompt });
          await main(history[event.from.id], message, event);
        } catch (e) {
          message.reply(e.message);
        }
      }
    }
  },

  reply: async function({ message, event, args, Context }) {
    let { author, cmd, messageID } = Context;
    if (author != event.from.id) return;
    if (!event.text) return;
    const prompt = args.join(" ");
    history[event.from.id].push({ role: 'user', content: prompt });
    try {
      global.bot.reply.delete(messageID);
      await main(history[event.from.id], message, event);
    } catch (e) {
      message.reply(e.message);
    }
  },

  inline_query: async function({ event, api }) {
    try {
      if (!event.query) return;
      if (!history[event.from.id]) {
        history[event.from.id] = [];
      }
      history[event.from.id].push({ role: 'user', content: event.query });
      const response = await inline({ event, history });
      const result = {
        type: 'article',
        id: '1',
        title: 'AI Response',
        input_message_content: {
          message_text: response
        }
      };
      await api.answerInlineQuery(event.id, [result]);
    } catch (err) {
      throw err;
    }
  }
};

async function inline({ event, history }) {
  if (!global.config.groq.groq_api_key) {
    throw new Error("Get your ApiKey from console.groq.com/keys and place it in the config.json");
  }
  if (!history[event.from.id] || !Array.isArray(history[event.from.id])) {
    history[event.from.id] = [];
  }

  if (history[event.from.id].length >= maxStorageMessage) {
    history[event.from.id].shift();
  }

  const requestData = {
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant"
      },
      ...history[event.from.id]
    ],
    model: "mixtral-8x7b-32768",
    temperature: 1,
    max_tokens: 1024,
    top_p: 1,
    stop: [],
    stream: false
  };

  const requestHeaders = {
    'Authorization': 'Bearer ' + global.config.groq.groq_api_key,
    'Content-Type': 'application/json'
  };

  try {
    const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", requestData, { headers: requestHeaders });
    const replyContent = response.data.choices[0].message.content;
    history[event.from.id].push({ role: 'assistant', content: replyContent });
    return replyContent;
  } catch (error) {
    throw error;
  }
}

async function main(history, message, event, chatType) {
  if (!global.config.groq.groq_api_key) {
    throw new Error("Get your ApiKey from console.groq.com/keys and place it in the config.json");
  }
  if (!history[event.from.id] || !Array.isArray(history[event.from.id])) {
    history[event.from.id] = [];
  }

  if (history[event.from.id].length >= maxStorageMessage) {
    history[event.from.id].shift();
  }

  const requestData = {
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant"
      },
      ...history[event.from.id]
    ],
    model: "mixtral-8x7b-32768",
    temperature: 1,
    max_tokens: 1024,
    top_p: 1,
    stop: [],
    stream: false
  };

  const requestHeaders = {
    'Authorization': 'Bearer ' + global.config.groq.groq_api_key,
    'Content-Type': 'application/json'
  };

  try {
    message.indicator();
    const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", requestData, { headers: requestHeaders });
    const replyContent = response.data.choices[0].message.content;
    history[event.from.id].push({ role: 'assistant', content: replyContent });
    const reply = await message.reply(replyContent, { parse_mode: "Markdown" });
    if (!chatType) {
      global.bot.reply.set(reply.message_id, {
        cmd: "ai",
        author: event.from.id,
        messageID: reply.message_id
      });
    }
  } catch (error) {
    throw error;
  }
}