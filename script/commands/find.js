module.exports = {
  config: {
    name: "find",
    aliases: ["search"],
    usage: "{pn} user Name or {pn} thread Title",
    description: "Look For User or Thread",
    role: 2,
    category: "utility"
  },
  start: async function({ event, api, message, cmd, args, usersData, threadsData }) {
    try {
      switch (args?.[0]) {
        case 'user': {
          if (!args[1])
            return message.Syntax(cmd, "Invalid Usage", "Missing Name");

          let users = await usersData.getAll();
          const searchTerm = args.slice(1).join(" ").toLowerCase();

          users = users.filter(user => {
            const fullName = `${user.first_name} ${user.last_name || ''}`.toLowerCase();
            return user.first_name.toLowerCase().includes(searchTerm) ||
              (user.last_name && user.last_name.toLowerCase().includes(searchTerm)) ||
              fullName.includes(searchTerm) ||
              (user.username ?? '').toLowerCase().includes(searchTerm);
          });

          if (users.length === 0) {
            return message.reply("No Such User Found");
          } else {
            let userResults = users.map(user =>
              `Name: ${user.first_name} ${user.last_name || ''}\nUsername: ${user.username ?? 'N/A'}\nID: ${user.id}`
            ).join('\n\n');
            return message.reply(`Found Users:\n\n${userResults}`);
          }
        }
        case 'thread': {
          if (!args[1])
            return message.Syntax(cmd, "Invalid Usage", "Missing Title");

          let threads = await threadsData.getAll();
          const searchTerm = args.slice(1).join(" ").toLowerCase();

          threads = threads.filter(thread => (thread.title ?? '').toLowerCase().includes(searchTerm));

          if (threads.length === 0) {
            return message.reply("No Such Thread Found");
          } else {
            let threadResults = threads.map(thread =>
              `Title: ${thread.title}\nID: ${thread.id}`
            ).join('\n\n');
            return message.reply(`Found Threads:\n\n${threadResults}`);
          }
        }
        default:
          return message.Syntax(cmd);
      }
    } catch (err) {
      console.error(err)
      message.reply(err.message);
    }
  }
}