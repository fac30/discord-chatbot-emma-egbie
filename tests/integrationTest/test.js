const test = require('node:test');

const assert = require('assert');
const dotenv = require("dotenv").config();

const BotManager = require('../../src/BotManager.js');


const DISCORD_BOT_TOKEN = dotenv.parsed.DISCORD_BOT_TOKEN;
const SERVER_ID = dotenv.parsed.SERVER_ID;
const OPEN_AI_KEY = dotenv.parsed.OPEN_AI_KEY;