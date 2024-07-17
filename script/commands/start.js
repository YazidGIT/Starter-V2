module.exports = {
  config: {
    name: "start",
    description: {
      short: "Initiates The Bot",
      long: "Just a greetings"
    },
    category: "system"
  },

  start: async function({ message }) {
    return await message.Syntax("help", "Greetings", "Hello There. Press the button below to get all of the available commands")
  }
};