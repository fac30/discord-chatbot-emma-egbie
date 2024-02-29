// This file will contain all the tests we want to run.
// We will import the tests from the DiscordBot, Integration, and OpenAI folders and run them here.

// Usage:
// Import the test suites.
// const DiscordBotTestSuite = require('./discordbot/test.js');
// const IntegrationTestSuite = require('./integrationTest/test.js');

// Initialize the test suites.
// const botTestSuite = new DiscordBotTestSuite();
// const integrationTestSuite = new IntegrationTestSuite();

// Run all test suites.
// botTestSuite.runTests();
// integrationTestSuite.runTests();

// To run the tests, look into the package.jason scripts, and run 'npm run test':
// "test": "node --test tests/mainTestFile.js"

// Importing the test suites
const DiscordBotTestSuite = require("./discordbot/test.js");
const IntegrationTestSuite = require("./integrationTest/test.js");

// Initialize test suites
const botTestSuite = new DiscordBotTestSuite();
const integrationTestSuite = new IntegrationTestSuite();

// Run all test suites
botTestSuite.runTests();
require("./openAi/openAi.test.js");
integrationTestSuite.runTests();

botTestSuite.runTests();
