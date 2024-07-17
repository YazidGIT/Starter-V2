const EventEmitter = require('events');
const eventEmitter = new EventEmitter();

var log = global?.log;

eventEmitter.on('critical_error', (error, code = 1) => {
  log(`Critical Error: ${typeof error === "object" && error.message ? error.message : typeof error === "string" ? error : "Unspecified Error"}\n\nShutting down System!`);
  process.exit(code)
});

eventEmitter.on('error', async (error, event, bot) => {
  try {
    const text = `Error Occurred\n${typeof error === "object" && error.message ? error.message : typeof error === "string" ? error : "Unspecified Error"}`;
    const message_id = event?.message?.message_id || event?.message_id;
    const person = event?.chat?.id || event?.from?.id;
    if (!bot) {
      throw new Error("Passed param must include 'bot'")
    }
    if (!message_id || !person) {
      throw new Error("Unspecified Message_ID or Chat_ID")
    }
    await bot.sendMessage(person, text, { reply_to_message_id: message_id })
  } catch (err) {
    throw err
  }
});