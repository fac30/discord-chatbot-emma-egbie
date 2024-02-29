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

// To run the tests, navigate to the test folder and run:
// node ./mainTestFile.js
//
// To run openai test navigate to folder and do the same command
// node ./openAitest.js

// Importing the test suites
const DiscordBotTestSuite = require("./discordbot/test.js");
const IntegrationTestSuite = require('./integrationTest/test.js');

// Initialize test suites
const botTestSuite = new DiscordBotTestSuite();
const integrationTestSuite = new IntegrationTestSuite();

// Run all test suites or uncomment the one you want to run
// botTestSuite.runTests();

integrationTestSuite.runTests();

botTestSuite.runTests();
