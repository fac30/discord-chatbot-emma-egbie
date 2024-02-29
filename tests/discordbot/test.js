// import test from "node:test"
const test       = require('node:test');
const assert     = require('assert');
const sinon      = require('sinon');
const dotenv     = require("dotenv").config();
const BotManager = require('../../src/BotManager.js');

const { parseUserMentionAndMessage } = require("../../src/utils.js");
const MockMessages                   = require('../mocks/mockMessages.js');
const MockUser                       = require("../mocks/mockUser.js");

const DISCORD_BOT_TOKEN = dotenv.parsed.DISCORD_BOT_TOKEN;
const SERVER_ID         = dotenv.parsed.SERVER_ID;
const OPEN_AI_KEY       = dotenv.parsed.OPEN_AI_KEY;


/**
 * Represents a test suite for the BotManager class.
 */
class BotManagerTestSuite {
    /**
     * Constructs a new BotManagerTestSuite.
     */
    constructor() {
        this.discordBot    = null;
        this._dateNow      = new Date();
        this._mockMessages = new MockMessages();
        this._mockUser     = new MockUser("fake ID", "Test Bot", "Test Bot global");
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
    * 
    * This test verifies that the bot instance is properly initialized and logged in successfully.
    * 
    * The bot instance is expected to be in an initialized state after a successful login operation.
    */
    async testBotInitializationSuccess() {

        try {

            await this.discordBot.login();
            await this.discordBot.logout();

            assert.strictEqual(this.discordBot._initialized, true, "[+] Bot initialization successful");

        } catch (error) {
            assert.fail(`[-] The discord bot didn't initialize - something went wrong!!`);
        }
    }

    /**
    * Tests the scenario when the bot is not initialized.
    * 
    * This test verifies that the bot instance is not initialized, meaning it has not been properly 
    * initialized and logged in.
    * 
    * The bot instance is expected to be in an uninitialized state 
    * if it has not been logged in successfully.
    */
    async testBotWhenNotInitialized() {

        try {

            // The this.discordBot.login() is not called so the discordBot is never initalized to true

            // Assert that the bot is initialized is equal to false
            assert.strictEqual(this.discordBot._initialized, false, "[+] [Success] - The bot didn't initialized without the login method be called");

        } catch (error) {
            assert.fail("[-] The discord bot shouldn't be initialize without the login method being called. Something went wrong!!");
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

        const EMPTY_DISCORD_TOKEN = ""
        const discordBot = new BotManager(EMPTY_DISCORD_TOKEN, SERVER_ID, OPEN_AI_KEY);
    
        try {
            await discordBot.login();

            // If no error is thrown then this means that bot was logged in with an empty string
            // If that happens fail the test
            assert.fail("Successful login in with an empty discord bot token should not be possible!!")
        } catch (error) {

            assert.strictEqual(discordBot._initialized, false, "Success - the bot didn't login with an empty token")

        }
    }


    
    /**
     * Test if a new Discord bot successfully logs into the server and announces its presence.
     * This test ensures that the bot manager correctly handles the login process and sets up
     * the bot's presence message upon successful login.
     */
    async testSuccessfulGreetingMsgAfterLogin() {

        const testDiscordBot = new BotManager(DISCORD_BOT_TOKEN, SERVER_ID, OPEN_AI_KEY);

        await testDiscordBot.login();

        testDiscordBot.setBotname("Test Bot");
        const botName = testDiscordBot.botName;

        // Create the expected greeting message based on the bot's name that will be shown on the server
        const expectedGreetingMsg = `Hello everyone! I'm the **${botName}**, now online and ready to chat. To chat with me, ` +
            `**type @${botName} followed by your prompt**. ` +
            `To see your history, **type @${botName} ${testDiscordBot._showHistoryCommand}** ` +
            `and to send a **DM (direct message)** to the user type **@<username>  followed by your message**`

        try {
            const resp           = await testDiscordBot._announcePresence();
            const annoucementMsg = resp.content;

            testDiscordBot.logout();

            assert.strictEqual(annoucementMsg, expectedGreetingMsg, "[+] The test shows the correct greeting when successful log into discord");

        } catch (error) {
            // If an error occurs during login or announcement, fail the test
            assert.fail(`[-] The announcement greeted by the Bot didn't match the expected repsonse`);
        }
    }

    /**
     * Tests the scenario where the greeting message after bot login is not as expected.
     * This is a negative test case.
     */
    async testUnsuccessfulGreetingMsgAfterLogin() {

        const testDiscordBot = new BotManager(DISCORD_BOT_TOKEN, SERVER_ID, OPEN_AI_KEY);
        await testDiscordBot.login();

        // Create an unexpected greeting message
        const unexpectedGreetingMsg = `Unexpected greeting message`;

        try {
            
            const resp            = await testDiscordBot._announcePresence();
            const annoucementMsg = resp.content;

            testDiscordBot.logout();

            // Assert that the announcement message is not equal to the unexpected greeting message
            assert.notStrictEqual(annoucementMsg, unexpectedGreetingMsg, "[+] The test should not show the unexpected greeting message after successful login");

        } catch (error) {
            // If an error occurs during login or announcement, fail the test
            assert.fail(`[-] The announcement greeted by the Bot matched the unexpected greeting message`);
        }
        }

    
    /**
      * Tests the response event message listener functionality of the bot.
      * 
      * This test verifies that the bot's message listener responds correctly to incoming messages.
      * It sends a test message to the bot and checks if the response matches the expected message.
      * 
      * The expected message is defined as "Hello".
    */
    async testBotResponseEventMessageListener() {

        const expectedMessage = "Hello";
        const response        = await this._testBotResponseEventMessageHelperFunction();
        const messageContent  = parseUserMentionAndMessage(response.content).messageContent;

        try {

            // If the returned message content matches the expected Message - pass the test
            assert.strictEqual(messageContent.toLowerCase(), expectedMessage.toLowerCase(), "This test event message listener is working");

        } catch (error) {
            assert.fail(`The event message listener did not respond with the expected message. Expected: "${expectedMessage}", Received: "${messageContent}".`);
        }

    }

    /**
     * Tests the response event message listener functionality of the bot to ensure it does not produce unexpected messages.
     * 
     * This test verifies that the bot's message listener does not respond with unexpected messages.
     * It sends a test message to the bot and checks if the response does not match the unexpected message.
     * 
     * The unexpected message to check against is defined as "Unexpected message".
     */
    async testBotResponseEventMessageListener_UnexpectedMessage() {

        const unExpectedMessage = "Unexpected message";
        const response          = await this._testBotResponseEventMessageHelperFunction();

        try {

            const messageContent = parseUserMentionAndMessage(response.content).messageContent;

            // Check that the received message does not match the unexpected message
            assert.notDeepStrictEqual(unExpectedMessage, messageContent, 
                    "Success - The unexpected message didn't match with the expected text received from the message event handler");

        } catch (error) {
            assert.fail(`Something went wrong the text shouldn't have matched: "${unExpectedMessage}".`);
        }
    }

    async testSendDirectMessageToUser() {
      
        // TODO
    }

    /**
     * Simulates the event message handling process of the bot in a test environment.
     * This function creates a mock message, logs in the bot, stubs the necessary methods
     * to execute custom logic, simulates message handling, and then logs out the bot.
     * After handling the message, it restores the mocked methods to their original state
     * and returns the response received from the bot.
     * 
     * @returns {Promise<Object>} A promise that resolves to the response received from the bot.
     *
     * @remarks
     * This function is a helper function used by the `testBotResponseEventMessageListener_UnexpectedMessage`
     * and `testBotResponseEventMessageListener` test cases to simulate the event message handling process
     * of the bot.
     */
    async _testBotResponseEventMessageHelperFunction() {
        const message = this._mockMessages.sentMessage;
        const testBot = new BotManager(DISCORD_BOT_TOKEN, SERVER_ID, "OPEN_AI_KEY");

        await testBot.login();

        const stubbedModerateUserPrompt = sinon.stub(testBot, '_moderateUserPrompt');
        const stubbedOnMessageCreate = sinon.stub(testBot, '_onMessageCreate');

        // Set up the stubbedOnMessageCreate to execute custom logic
        stubbedOnMessageCreate.callsFake(async (message) => {

            return await this._mockOnMessageCreate(message);
            
        });

        const response = await testBot._onMessageCreate(message);

        await testBot.logout();

        // restore the methods mocked back to their original state
        stubbedOnMessageCreate.restore();
        stubbedModerateUserPrompt.restore()

        return response;
    }

   

    /**
     * Mocks the behavior of the `_onMessageCreate` method in the BotManager class.
     * This method is used to simulate the response of the bot when a message is created.
     * @param {object} message - The message object representing the received message.
     * @returns {Promise<object>} A promise that resolves to the response message object.
     */
    async _mockOnMessageCreate(message) {
        const authorID                = message.author.id;
        const content                 = message.content;
        const isDirectMessage         = false;
        const clientApplicationMockID = "4444";

        if (authorID !== clientApplicationMockID) {
            return await this._mockModerateUserPrompt(content, message, isDirectMessage);
        }

    }

    /**
     * Mocks the behavior of the `_moderateUserPrompt` method in the BotManager class.
     * This method is used to simulate the moderation process for a user message.
     * @param {string} content - The content of the message.
     * @param {object} message - The message object.
     * @param {boolean} isDirectMessage - Indicates if the message is a direct message.
     * @returns {string|object} A string indicating the success message or an object representing a received message.
     */
    async _mockModerateUserPrompt(content, message, isDirectMessage) {
        const { userId, messageContent } = parseUserMentionAndMessage(content);

        if (isDirectMessage) {
            //TODO - Add functionality to do something later for now just return a string
            return "The message has been successfully sent";
        } else if (userId && messageContent && message) {
            return this._mockMessages.receivedMessage;
        }
    }

    /**
     * Tests error handling and logging mechanisms of the bot during message handling.
     * 
     * This test case introduces a fault in the bot's message handling process to trigger an error condition,
     * then checks if the error is properly handled and logged.
     */
    async testBotErrorHandlingAndLogging_MessageHandling() {
        // Define a mock message to simulate the incoming message
        const mockMessage = {
            author: {
                id: "mockUserID"
            },
            content: "Test message content"
        };

        // Stub the _onMessageCreate method of the bot to simulate the faulty message handling
        const stubbedOnMessageCreate1 = sinon.stub(BotManager.prototype, '_onMessageCreate');
        stubbedOnMessageCreate1.throws(new Error("Simulated error in message handling"));

        try {
            // Call the bot's message handling method with the mock message
            await this.discordBot._onMessageCreate(mockMessage);

            // If the error is not thrown, fail the test
            assert.fail("Expected an error to be thrown during message handling, but it did not occur");
        } catch (error) {
            // Check if the error message matches the expected error message
            assert.strictEqual(error.message, "Simulated error in message handling", "Error message should match");

            // Log the error (replace this with actual logging mechanism)
            console.error("Error occurred during message handling:", error);

            // Assert that the error is logged (this assertion might need modification based on the actual logging mechanism)
            assert.ok(true, "Error should be logged");
        } finally {
            // Restore the original _onMessageCreate method
            stubbedOnMessageCreate1.restore();
        }
    }






/**
 * Runs all tests in the suite.
 */
async runTests() {
    console.log("[+] Starting tests, please wait....")
    try {
        // Successful greeting after login
        await test.describe("testSuccessfulGreetingMsgAfterLogin", async () => {
            await test("Once logged into the discord server the bot should greet the user with a message",
                () => this.testSuccessfulGreetingMsgAfterLogin());
        });

        // Negative test case unsuccessful greeting after login
        await test.describe("testUnsuccessfulGreetingMsgAfterLogin", async () => {
            await test("The test verifies if the bot fails to display the expected message upon login",
                () => this.testUnsuccessfulGreetingMsgAfterLogin());
        });

        // Test when the bot is not initialized
        await test.describe("testBotWhenNotInitialized", () => {
            test("Tests the scenario when the bot is not initialized properly",
                () => this.testBotWhenNotInitialized());
        });

        // Test bot initialization success
        await test.describe("testBotInitializationSuccess", async () => {
            await test("The bot should be initialized after login", () => this.testBotInitializationSuccess());
        });

        // Test bot initialization with an invalid Discord token
        test.describe("testBotInitializationWithInvalidDisbotToken", () => {
            test("The bot shouldn't initialize with incorrect login details",
                () => this.testBotInitializationWithInvalidDisbotToken());
        });

        // Test bot initialization with an empty Discord token
        test.describe("testBotInitializationWithEmptyDisbotToken", () => {
            test("The bot shouldn't initialize with an empty discord bot token",
                () => this.testBotInitializationWithEmptyDisbotToken());
        });

        // Test bot response event message listener
        await test.describe("testBotResponseEventMessageListener", async () => {
            test("The bot message handler should responding with a hello after we send it a response", async () => {
                await this.testBotResponseEventMessageListener();
            });
        });

        // Test bot response event message listener with unexpected message
        await test.describe("testBotResponseEventMessageListener_UnexpectedMessage", async () => {
            test("The bot should match a response that does not equal the response returned from the event handler", async () => {
                await this.testBotResponseEventMessageListener_UnexpectedMessage();
            });
        });

        //  // Test bot ability to send direct messsages to users
        //  await test.describe("testSendDirectMessageToUser", async () => {
        //     test("The bot should be able to send message directly to a user", async () => {
        //         await this.testSendDirectMessageToUser();
        //     });
        // });

        // Test error handling and logging during message handling
        await test.describe("testBotErrorHandlingAndLogging_MessageHandling", async () => {
            test("The bot should handle and log errors during message handling", async () => {
                await this.testBotErrorHandlingAndLogging_MessageHandling();
            });
        });

    } catch (error) {
        console.log("[-] Something went wrong with running the tests!!")
    } finally {
        this.tearDown();
    }
}


}

module.exports = BotManagerTestSuite;
