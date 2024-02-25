const assert = require("assert");
const dotenv = require("dotenv").config();

const { test, describe, beforeEach } = require("node:test");
const OpenAiManager = require("../src/OpenAiManager");

describe("environment variables", () => {
  test("has values for the necessary environment variables", () => {
    const OPEN_AI_KEY = dotenv.parsed.OPEN_AI_KEY;

    assert.ok(OPEN_AI_KEY.length > 0);
  });
});

describe("getUserHistory", () => {
  /** @type {OpenAiManager} */
  let openAiManager;

  beforeEach(() => {
    openAiManager = new OpenAiManager("1234");
  });

  test("returns an empty list when there's no user history", () => {
    const messages = openAiManager.getUserHistory();
    assert.deepEqual(messages, []);
  });

  test("returns the user prompts & replies if available", () => {
    const userName = "userName";
    const testPrompt = "testPrompt";
    const testResponse = "testResponse";

    openAiManager._cache = { [userName]: { [testPrompt]: testResponse } };

    const messages = openAiManager.getUserHistory(userName);
    assert.deepEqual(messages, [[testPrompt, testResponse]]);
  });

  test("doesn't return the wrong user's chats", () => {
    const userName = "userName";
    const testPrompt = "testPrompt";
    const testResponse = "testResponse";

    openAiManager._cache = { [userName]: { [testPrompt]: testResponse } };

    const messages = openAiManager.getUserHistory("faulty user name");
    assert.deepEqual(messages, []);
  });
});

// describe("_getUserChats", () => {});

// describe("_constructMessage", () => {});
