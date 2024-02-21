// import test from "node:test"
const test = require('node:test');

const assert = require('assert');
const dotenv = require("dotenv").config();

const BotManager = require('../../src/BotManager.js');


const DISCORD_BOT_TOKEN = dotenv.parsed.DISCORD_BOT_TOKEN;
const SERVER_ID = dotenv.parsed.SERVER_ID;
const OPEN_AI_KEY = dotenv.parsed.OPEN_AI_KEY;



// Mock Discord client



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
            // Mock the Discord client
            const mockClient = {
                user: {
                    displayName: "MockUser"
                },
                login: function () {
                    // Simulate login success
                    return Promise.resolve();
                },
                once: function (event, callback) {
                    // Simulate the Ready event
                    if (event === 'ready') {
                        callback();
                    }
                }
            };

            // Replace the real client with the mock client
            this.discordBot._client = mockClient;

            // Call the login method
            await this.discordBot.login();

            // Assert that the bot is initialized
            if (!this.discordBot._initialized) {
                throw new Error("[-] Bot initialization failed");
            }

            console.log("[+] Bot initialization successful");
        } catch (error) {
            console.error("[-] Bot initialization failed:", error.message);
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
    * Tests bot initialization with an empty Discord bot token.
    */
    async testBotInitializationWithEmptyDisbotToken() {
        const discordBot = new BotManager("", SERVER_ID, OPEN_AI_KEY);

        try {
            await discordBot.login();
            assert.fail("Expected the test to fail but the test succeeded");
        } catch (error) {
            assert.ok(error instanceof Error, 'BotManager initialization should throw an error with an empty token.');
        }
    }


    /**
     * Runs all tests in the suite.
     */
    async runTests() {
        test.describe("testBotInitializationSuccess", () => {
            test("The bot should be initialized after login", () => this.testBotInitializationSuccess());
        })
      
        test.describe("testBotInitializationWithInvalidDisbotToken", () => {
            test("The bot shouldn't initialize with incorrect login details", () => this.testBotInitializationWithInvalidDisbotToken());

        })

        test.describe("testBotInitializationWithEmptyDisbotToken", () =>  {
            test("The bot shouldn't initialize with an empty discord bot token", () => this.testBotInitializationWithEmptyDisbotToken());
        });
       
    }
}

module.exports = BotManagerTestSuite;

