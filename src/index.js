

const BotManager  = require('./bot_manager.js');


const openAi            = require("openai");
const dotenv            = require("dotenv").config();

const DISCORD_BOT_TOKEN = dotenv.parsed.DISCORD_BOT_TOKEN;
const OPEN_AI_KEY       = dotenv.parsed.OPEN_AI_KEY;
const SERVER_ID         = dotenv.parsed.SERVER_ID;



 const discordBot = new BotManager(DISCORD_BOT_TOKEN, SERVER_ID);

 discordBot.init();
 discordBot.login();
 discordBot.announceNewMember();
 discordBot.announceMemberLeave();
