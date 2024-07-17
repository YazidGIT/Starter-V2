const log = require("./logger/kleur.js");
const config = require("./config.json");
const config_handler = require("./config_handler.json");
const axios = require("axios");
const utils = require("./utils");

global.tmp = {
  manga: new Set(),
  mangaID: new Map(),
  spotify: new Set()
};

global.games = {};

global.config_handler = config_handler;
global.config = config;

global.prefix = {};

global.server = {
  logs: []
}

global.utils = {};
global.log = log;
global.bot = {
  text: [],
  message: new Map(),
  reply: new Map(),
  inline_query: new Map(),
  chosen_inline_result: new Map(),
  callback_query: new Map(),
  shipping_query: new Map(),
  edited_message: new Map(),
  channel_post: [],
  edited_channel_post: [],
  pre_checkout_query: new Map(),
  poll: new Map(),
  poll_answer: new Map(),
  chat_member: new Map(),
  my_chat_member: new Map(),
  chat_join_request: new Map(),
  audio: new Map(),
  document: new Map(),
  photo: new Map(),
  sticker: new Map(),
  video: new Map(),
  video_note: new Map(),
  voice: new Map(),
  contact: new Map(),
  location: new Map(),
  venue: new Map(),
  new_chat_members: new Map(),
  left_chat_member: new Map(),
  new_chat_title: new Map(),
  new_chat_photo: new Map(),
  delete_chat_photo: new Map(),
  group_chat_created: new Map(),
  supergroup_chat_created: new Map(),
  channel_chat_created: new Map(),
  migrate_to_chat_id: new Map(),
  migrate_from_chat_id: new Map(),
  pinned_message: new Map()
};

global.cooldown = new Map();

global.mongo = {};
global.sqlite = {};

axios.get("https://gist.githubusercontent.com/SatoX69/247e9d735a145fc059715a92ccd7b0f6/raw/4d1287c6750d84e55ece9e405ddc988643baf2b9/allowed_emojis.json")
  .then(response => {
    global.react_emojis = response.data.emojis;
  })
  .catch(err => {
    log("Failed to set global EMOJI", "red");
    global.react_emojis = [];
  });

global.yapp = `By accessing or using our services, you acknowledge and agree to the following:

Interactions: Your interactions, including the initialization and execution of commands, may be recorded for analysis and optimization.
Data Storage: Any data you provide may be securely stored and processed for record-keeping and future analysis.
Purpose: Our services are for entertainment purposes only and should not be relied upon for any other use.
Privacy: Group logs may capture metadata (excluding content) for privacy and security reasons.
Consent: User consent is required for data sharing beyond stated purposes, as per our privacy policy.
Data Retention: We follow data retention policies to comply with regulations and protect user information.
Enhancements: Collected data will be used to enhance user experience, improve service quality, and personalize interactions.
User Rights: You have the right to request access to, deletion, or modification of your stored data.
Security: Measures such as encryption, access controls, and regular audits will be employed to safeguard user data.
Admin Requests: Use the \`calladmin\` command to report or request changes regarding your data.
Content Storage: The bot will not store any content sent in chats.
Webhook Utilization: The bot sends content to a secure webhook when triggered by certain commands.

You will be able to use the commands once you agree to these terms.`;

log("Loading Utils", "blue");
for (let util of Object.keys(utils)) {
  try {
    global.utils[util] = utils[util];
  } catch (err) {
    log(`Error while loading util ${util}: ${err.message}`);
  }
}
log("Successfully Loaded Utils", "white", true);