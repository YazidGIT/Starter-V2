module.exports = {
  config: {
    name: "info",
    usage: "{pn}",
    description: "Get your info like user_id and all",
    category: "utility"
  },
  start: async function({ event, message, usersData }) {
    const { from: { id, is_bot, first_name, username, language_code }, chat } = event;
    const userData = await usersData.retrieve(id);

    // Recursive function to format user data including nested objects
    const formatUserData = (data, indent = 0) => {
      let formattedData = "";
      const indentation = ' '.repeat(indent * 2);

      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'object' && value !== null) {
          formattedData += `${indentation}<b>${key}:</b>\n${formatUserData(value, indent + 1)}`;
        } else {
          formattedData += `${indentation}<b>${key}:</b> ${value}\n`;
        }
      }
      return formattedData;
    };

    const userDataText = formatUserData(userData);

    const infoText = `
<b>Sender Information</b>
<b>ID:</b> ${id}
<b>Is Bot:</b> ${is_bot}
<b>First Name:</b> ${first_name}
<b>Username:</b> ${username || "Not Specified"}
<b>Language Code:</b> ${language_code}

<b>Chat Information</b>
<b>ID:</b> ${chat.id}
<b>Type:</b> ${chat.type}

<b>User Data:</b>
${userDataText}`;

    message.reply(`<pre>${infoText}</pre>`, { parse_mode: "HTML" });
  }
}