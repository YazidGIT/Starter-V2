const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const tmp_dir = path.join(__dirname, 'tmp');

module.exports = {
  config: {
    name: "shell",
    aliases: ["sh"],
    role: 2,
    description: "Quick Terminal Access",
    usage: "{pn} <code>",
    category: "system"
  },
  start: async function({ message, args, event, api }) {
    if (!args[0]) return message.Syntax(this.config.name);
    exec(args.join(" "), async (error, stdout, stderr) => {
      if (error) {
        message.reply(`<pre><b>${error.message}</b></pre>`, { parse_mode: "HTML" });
      } else {
        if (stdout.length > 1000) {
          const filename = `Jsus_err-${Date.now()}.txt`;
          const file = path.join(tmp_dir, filename);
          fs.writeFileSync(file, stdout);
          api.sendDocument(event.chat.id, file, {
            caption: "SDTout Output",
            type: "document",
            filename
          }).then(() => {
            fs.unlinkSync(file);
          }).catch(err => {
            console.error("Error sending document:", err);
            fs.unlinkSync(file);
          });
        } else {
          if (stdout || stdout.length > 0)
            message.reply("```shell" + `\n${stdout || "null"}\n` + "```", { parse_mode: "Markdown" });
        }
      }
    });
  }
};