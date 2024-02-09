const BotManager = require("./BotManager.js");

const dotenv = require("dotenv").config();

const DISCORD_BOT_TOKEN = dotenv.parsed.DISCORD_BOT_TOKEN;
const SERVER_ID = dotenv.parsed.SERVER_ID;

const discordBot = new BotManager(DISCORD_BOT_TOKEN, SERVER_ID);

discordBot.login();
