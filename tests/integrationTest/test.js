const test  = require('node:test');
const sinon = require('sinon');

const assert = require('assert');
const dotenv = require("dotenv").config();

const BotManager     = require('../../src/BotManager.js');
const MockUser       = require("../mocks/mockUser.js");
const MockMessages   = require('../mocks/mockMessages.js');
const OpenAiManager  = require("../../src/OpenAiManager");

const { parseUserMentionAndMessage } = require("../../src/utils.js");



/**
 * IntegrationTestSuite class for testing the integration of various components.
 * This class provides methods to perform integration tests on the interactions 
 * between a Discord bot, an OpenAI manager, and other related components.
 */
class IntegrationTestSuite {
    constructor(DISCORD_BOT_TOKEN="DISCORD_BOT_TOKEN", SERVER_ID="SERVER_ID", OPEN_AI_KEY="OPEN_AI_KEY") {
        
        this.DISCORD_BOT_TOKEN   = DISCORD_BOT_TOKEN;
        this.SERVER_ID           = SERVER_ID;
        this. OPEN_AI_KEY        = OPEN_AI_KEY;
        this.testBot             = null;
        this.openAi              = null;
        this.mockMessage         = new MockMessages();
        this.isDirectMessage     = false;
        this._showHistoryCommand = "!showMyChatHistory";
        this.mockUser            = null;
        this.setup();
        
    }

    /**
     * Sets up the necessary components and dependencies for the integration test suite.
     * Initializes a mock user, user prompt, and OpenAI response.
     * Creates instances of BotManager and OpenAiManager with the provided tokens and keys.
     * Sets up the OpenAI cache with initial data.
     */
    setup() {
        this.mockUser       = new MockUser("1234", "username", "username");
        this.userPrompt     = "userPrompt";
        this.openaiResponse = "openaiResponse";
        this.testBot        = new BotManager(this.DISCORD_BOT_TOKEN, this.SERVER_ID, this.OPEN_AI_KEY);
        this.openAi         = new OpenAiManager(this.OPEN_AI_KEY);
    }

    /**
     * Sets up the OpenAI cache with initial data.
     * The cache is populated with a mock user's username mapped to a prompt and its corresponding OpenAI response.
     */
    _setupOpenAiCache() {
        this.openAi._cache = { [this.mockUser.username]: { [this.userPrompt]: this.openaiResponse } };
    }

    /**
     * Clears the OpenAI cache by resetting it to an empty array.
     */
    _clearOpenAiCache() {
        this.openAi._cache = [];
    }

    /**
     * Tests the behavior of the bot when retrieving chat history for a user.
     * 
     * - Calls the testChatHistoryHelperFunction to simulate a command requesting chat history.
     * - Compares the retrieved chat history with the expected user prompt and OpenAI response.
     * 
     * @throws {AssertionError} If the retrieved user prompt or OpenAI response does not match the expected values.
     */
    async testSimulatedCommandToBot__getChatHistory() {

        const expectedUserPrompt     = "userPrompt";
        const expectedOpenAiResponse = "openaiResponse";

        this._setupOpenAiCache();

        const response = await this.testChatHistoryHelperFunction();

        // Extract user prompt and OpenAI response from the retrieved chat history
        const history                      = response[0];
        const [userPrompt, openaiResponse] = history;

        this._clearOpenAiCache();
        try {
            assert.strictEqual(userPrompt, expectedUserPrompt, "The user prompt matches the expected prompt");
            assert.strictEqual(openaiResponse, expectedOpenAiResponse, "The OpenAI response matches the expected OpenAI response");
            assert.ok("The current chat history was returned successfully");
        } catch (error) {
            assert.fail("[-] Something went wrong, the correct chat history was not returned");
        }
    }

    /**
     * Tests the behavior of the bot when there is no chat history available for a user.
     * 
     * - Clears the OpenAI cache to simulate an empty chat history.
     * - Calls the testChatHistoryHelperFunction to simulate a command requesting chat history.
     * - Compares the response from the bot with the expected response indicating no chat history.
     * 
     * @throws {AssertionError} If the response from the bot does not match the expected response.
     */
    async testSimulatedCommandToBot__emptyChatHistory() {

        this._clearOpenAiCache();

        const expectedResponse = "There are no chats to view!";
        const response         = await this.testChatHistoryHelperFunction();

        try {
            assert.strictEqual(response, expectedResponse, "The test correctly showed the message when there are no chats to view");
        } catch (error) {
            assert.fail(`[-] The chat history should be empty, but returned: [${response}]`);
        }
    }

    /**
     * Helper function for testing the retrieval of chat history by simulating a command to the bot.
     * 
     * - Logs in the test bot.
     * - Constructs a message simulating a command to retrieve chat history.
     * - Stub the _onMessageCreate method of the bot to execute custom logic.
     * - Calls the _mockOnMessageCreate method with the constructed message.
     * - Restores the stubbed method after completion.
     * 
     * @returns {Promise<any>} A promise resolving to the response obtained from simulating the command.
     */
    async testChatHistoryHelperFunction() {

        this.testBot.login = this.mockLogin.bind(this);
        await this.testBot.login();

        const message           = this.mockMessage.sentMessage;
        message.author.username = this.mockUser.username;
        message.content         = `<@1212167139935522926> ${this._showHistoryCommand}`; // <user> <show history command>

        // Stub the _onMessageCreate method of the bot to execute custom logic
        const stubbedOnMessageCreate = sinon.stub(this.testBot, '_onMessageCreate');
        stubbedOnMessageCreate.callsFake(async (message) => {
            return await this._mockOnMessageCreate(message);
        });

        // When called it will replace the actually message without fake message
        const response = await this.testBot._onMessageCreate(message);

        // Restore the stubbed method
        stubbedOnMessageCreate.restore();

        return response;
    }

    /**
     * Tests the _generateFieldsFromQAPairs method of the BotManager class.
     * 
     * - Sets up the OpenAI cache.
     * - Retrieves chat history for the mock user from the OpenAI cache.
     * - Generates fields from the question-answer pairs in the chat history.
     * - Extracts the letters 'Q' and 'A' from the generated fields.
     * - Compares the extracted letters with the expected letters.
     * 
     * @throws {AssertionError} If the extracted letters do not match the expected letters or if the object does not contain both letters.
     */
    test__generateFieldsFromQAPairsMethod() {
        this._setupOpenAiCache();

        const expectedLetterQ = "Q";
        const expectedLetterA = "A";

        const chatHistory = this.openAi.getUserHistory(this.mockUser.username);

        // Generate fields from the question-answer pairs in the chat history
        const fields = this.testBot._generateFieldsFromQAPairs(chatHistory);

        // Extract the first object
        const qAPair = fields[0];

        // Extract the letters 'Q' and 'A' from the object
        const letterQ = qAPair.name.split(":")[0];
        const letterA = qAPair.value.split(":")[0].split("**")[1];

        this._clearOpenAiCache();

        try {
            assert.strictEqual(letterQ, expectedLetterQ, "The letter Q matches with the expected letter");
            assert.strictEqual(letterA, expectedLetterA, "The letter A matches with the expected letter");
            assert.ok("The object contains both the letters 'Q' and 'A'");
        } catch (error) {
            assert.fail("The object does not contain both letters 'Q' and 'A'");
        }
    }

    test__generateFieldsFromQAPairsMethod__WhenChatHistoryIsEmpty() {
        this._clearOpenAiCache();
        const expectedResult = [];

        const chatHistory = this.openAi.getUserHistory(this.mockUser.username);

        // Generate fields from the question-answer pairs in the chat history
        const fields = this.testBot._generateFieldsFromQAPairs(chatHistory);

        this._clearOpenAiCache();
        
        try {
            assert.deepEqual(expectedResult, fields, "The method returns an empty [] when they is no chat history");
            assert.ok("The method successful returns an empty array when there is no chat history");
        } catch (error) {
            assert.fail("Expected an empty array but returned an array that wasn't empty");
        }
    }


    /**
     * Mock function to simulate the login process of the test bot.
     * 
     * Sets the '_initialized' flag to true to indicate successful login.
     * Resolves a Promise to indicate completion of the login process.
     * 
     * @returns {Promise<void>} A Promise indicating the completion of the login process.
    */
    async mockLogin() {
        this._initialized = true;
        return Promise.resolve();
    }

    /**
     * Mock function to simulate the behavior of handling messages in a Discord bot during testing.
     * 
     * @param {Message} message - The message object received by the bot.
     * @returns {Promise<void>} A Promise indicating the completion of the mock message handling process.
     */
    async _mockOnMessageCreate(message) {
        
        const authorID    = message.author.id;
        const content     = message.content;
        const currentTime = Date.now();
        
        const { userId, messageContent } = parseUserMentionAndMessage(content);

        let isDirectMessage = this.isDirectMessage;
        
        if (authorID !== "some mock id") {
            switch (true) {
                case isDirectMessage:
                    // Handle direct messages - do nothing for now
                    break;

                case messageContent && messageContent.trim() === this._showHistoryCommand:
                    return await this._mockShowUserChatHistory(message, currentTime);
    
            }
        }
    }


    /**
     * Mock function to simulate retrieving and displaying a user's chat history in a Discord bot during testing.
     * 
     * @param {Message} message - The message object containing the request for chat history.
     * @param {number} currentTime - The current time when the request is received.
     * @returns {Promise<string | Array>} A Promise resolving to either a string indicating no chat history
     *  available or an array containing the user's chat history.
     */
    async _mockShowUserChatHistory(message, currentTime) {

        const chatHistory = this.openAi.getUserHistory(message.author.username);

        if (!chatHistory.length) {
            return "There are no chats to view!";
        }

        return chatHistory;
    }


   /**
     * Runs integration tests for the Discord bot, including tests for retrieving user chat history,
     * handling cases where there is no chat history to view, and generating fields from Q&A pairs.
     */
    runTests() {
        console.log("\nIntegration tests");
        console.log("Beginning integration tests, please wait...");

        // Test for retrieving user chat history
        test.describe("testSimulatedCommandToBot__getChatHistory()", async () => {
            test.describe("_showUserChatHistory", async () => {
                await test("Test if the Discord bot returns the user chat history", async () => {
                    await this.testSimulatedCommandToBot__getChatHistory();
                });
            });
        });

        // Test for handling cases where there is no chat history to view
        test("Test if the Discord bot returns the user chat history when there is no history to view", async () => {
            await this.testSimulatedCommandToBot__emptyChatHistory();
        });

        // Test that chat history is returned in the form of Q&A pairs when called from _generateFieldsFromQAPairs method
        test.describe("_generateFieldsFromQAPairs", () => {
            test.describe("Test if the function returns the chat history in the form of Q & A", () => {
                this.test__generateFieldsFromQAPairsMethod();
            });
        });

        // Test that an empty array is returned if the  _generateFieldsFromQAPairs method is called with an empty chat history
         test.describe("_generateFieldsFromQAPairs", () => {
            test.describe("Test that an empty array is returned if the _generateFieldsFromQAPairs method is called with an empty chat history", () => {
                this.test__generateFieldsFromQAPairsMethod__WhenChatHistoryIsEmpty();
            });
        });


    }
   
}

module.exports = IntegrationTestSuite;
