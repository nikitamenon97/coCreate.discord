const config = require("./config.json");
const Discord = require("discord.js");

const client = new Discord.Client({
    intents: [
      Discord.GatewayIntentBits.Guilds,
      Discord.GatewayIntentBits.GuildMessages,
      Discord.GatewayIntentBits.MessageContent
    ]});

client.login(config.BOT_TOKEN);

module.exports = client;

// Client.on(Discord.Events.MessageCreate, projectsCallback);
// Client.on(Discord.Events.MessageCreate, proposalsCallback);
