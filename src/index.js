const dotenv = require("dotenv").config();
const BotManager = require("./BotManager.js");

const DISCORD_BOT_TOKEN = dotenv.parsed.DISCORD_BOT_TOKEN;
const SERVER_ID = dotenv.parsed.SERVER_ID;
const OPEN_AI_KEY = dotenv.parsed.OPEN_AI_KEY;

const discordBot = new BotManager(DISCORD_BOT_TOKEN, SERVER_ID, OPEN_AI_KEY);
discordBot.login();
