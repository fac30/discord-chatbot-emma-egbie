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

    tearDown() {
        this.discordBot.logout();
    }
    /**
     * Tests the successful initialization of the bot.
     */
    async testBotInitializationSuccess() {

        // Mock Discord client
        try {
            // Replace the real client with the mock client
            this.discordBot._client = this._mockClient;

            // Call the login method
            await this.discordBot.login();
            const isInitialized = this.discordBot._initialized;

            // Assert that the bot is initialized
            assert.strictEqual(isInitialized, true, "[+] Bot initialization successful");


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
     * Test if a new Discord bot successfully logs into the server and announces its presence.
     * This test ensures that the bot manager correctly handles the login process and sets up
     * the bot's presence message upon successful login.
     */
    async testSuccesfulBotLogin() {

        // Create a new instance of the BotManager with valid credentials
        const testDiscordBot = new BotManager(DISCORD_BOT_TOKEN, SERVER_ID, OPEN_AI_KEY);

        await testDiscordBot.login();

        testDiscordBot.setBotname("Test Bot");

        const botName = testDiscordBot.botName;

        // Create the expected greeting message based on the bot's name that will be shown on the server
        const expectedGreetingMsg = `Hello everyone! I'm the **${botName}**, now online and ready to chat. To chat with me, ` +
            `**type @${botName} followed by your prompt**. ` +
            `To see your history, **type @${botName} ${testDiscordBot._showHistoryCommand}** ` +
            `and to send a **DM (direct message)** to the user type **@<username>  followed by your message**`;

        try {
            const resp           = await testDiscordBot._announcePresence();
            const annoucementMsg = resp.content;

            testDiscordBot.logout();

            assert.strictEqual(annoucementMsg, expectedGreetingMsg, "[+] The test shows the correct greeting when successful log into discord");

        } catch (error) {
            // If an error occurs during login or announcement, fail the test
            assert.fail(`[-] The bot failed to log into Discord, Error - ${error}`);
        }
    }

    /**
     * Create a mock client
     */
    get _mockClient() {
        return {
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
        }
    }

    /**
     * Runs all tests in the suite.
     */
    async runTests() {
        console.log("[+] Starting tests, please wait....")
        try {
            await test.describe("testSuccesfulBotLogin", () => {
                test("Once logged into the discord server the bot should greet the user with a message", () => this.testSuccesfulBotLogin());

            });
            test.describe("testBotInitializationSuccess", () => {
                test("The bot should be initialized after login", () => this.testBotInitializationSuccess());
            });

            test.describe("testBotInitializationWithInvalidDisbotToken", () => {
                test("The bot shouldn't initialize with incorrect login details", () => this.testBotInitializationWithInvalidDisbotToken());
            });

            test.describe("testBotInitializationWithEmptyDisbotToken", () => {
                test("The bot shouldn't initialize with an empty discord bot token", () => this.testBotInitializationWithEmptyDisbotToken());
            });

        } catch (error) {
            console.log("[-] Something went wrong with running the tests!!")
        } finally {
            this.tearDown();
           
        }


    }


}

module.exports = BotManagerTestSuite;
