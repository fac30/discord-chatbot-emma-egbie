// import test from "node:test"
const test = require('node:test');

const assert = require('assert');
const dotenv = require("dotenv").config();

const BotManager = require('../../src/BotManager.js');


const DISCORD_BOT_TOKEN = dotenv.parsed.DISCORD_BOT_TOKEN;
const SERVER_ID = dotenv.parsed.SERVER_ID;
const OPEN_AI_KEY = dotenv.parsed.OPEN_AI_KEY;


/**
 * Represents a test suite for the BotManager class.
 */
class BotManagerTestSuite {
    /**
     * Constructs a new BotManagerTestSuite.
     */
    constructor() {
        this.botManager = null;
        this.setup();
    }

    /**
     * Sets up the test suite by creating a new BotManager instance.
     */
    setup() {
        this.discordBot = new BotManager(DISCORD_BOT_TOKEN, SERVER_ID, OPEN_AI_KEY);
    }

    /**
     * Tests the successful initialization of the bot.
     */
    async testBotInitializationSuccess() {
        try {
            resp = await this.discordBot.login();
            console.log(resp)
            assert.strictEqual(this.discordBot._initialized, true, "The Bot is initialized");
        } catch (error) {
            assert.fail("The bot should be initialized");
        }
    }

    /**
     * Tests bot initialization with an invalid Discord bot token.
     */
    async testBotInitializationWithInvalidDisbotToken() {
        const discordBot = new BotManager("INVALID_DISBOT_TOKEN", SERVER_ID, OPEN_AI_KEY);

        try {
            await discordBot.login();
            assert.fail("Expected the test to fail but the test succeeded");
        } catch (error) {
            assert.ok(error instanceof Error, 'BotManager initialization should throw an error.');
        }
    }

    

    /**
     * Runs all tests in the suite.
     */
    async runTests() {
        // test.describe("The bot should be initialized after login", () => this.testBotInitializationSuccess());
        test.describe("The bot shouldn't initialize with incorrect login details", () => this.testBotInitializationWithInvalidDisbotToken());
    }
}

module.exports = BotManagerTestSuite;

