// This file will contain all the tests we want to run.
// We will import the tests from the DiscordBot, Integration, and OpenAI folders and run them here.

// Usage:
// Import the test suites.
// const DiscordBotTestSuite = require('./discordbot/test.js');
// const OpenAiTestSuite = require('./openaiTest/test.js');
// const IntegrationTestSuite = require('./integrationTest/test.js');

// Initialize the test suites.
// const botTestSuite = new DiscordBotTestSuite();
// const openAiTestSuite = new OpenAiTestSuite();
// const integrationTestSuite = new IntegrationTestSuite();

// Run all test suites.
// botTestSuite.runTests();
// openAiTestSuite.runTests();
// integrationTestSuite.runTests();

// To run the tests, navigate to the test folder and run:
// node ./mainTestFile.js


// Importing the DiscordBotTestSuite from the discordbot folder
const DiscordBotTestSuite = require('./discordbot/test.js');

// Importing other test suites if needed - uncomment this once the appropriate classes have been created
// const OpenAiTestSuite = require('./openaiTest/test.js');
// const IntegrationTestSuite = require('./integrationTest/test.js');

// Initialize test suites
const botTestSuite = new DiscordBotTestSuite();
// const openAiTestSuite = new OpenAiTestSuite();
// const integrationTestSuite = new IntegrationTestSuite();


// Run all test suites
botTestSuite.runTests();
// openAiTestSuite.runTests();
// integrationTestSuite.runTests();
