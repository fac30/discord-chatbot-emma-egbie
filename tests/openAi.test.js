const assert = require("assert");
const dotenv = require("dotenv").config();

const { test, describe, beforeEach } = require("node:test");
const OpenAiManager = require("../src/OpenAiManager");

const RANDOM_KEY = "123";

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
    openAiManager = new OpenAiManager(RANDOM_KEY);
  });

  test("returns an empty list when there's no user history", () => {
    const messages = openAiManager.getUserHistory();
    assert.deepEqual(messages, []);
  });

  describe("existing user", () => {
    const userName = "userName";
    const testPrompt = "testPrompt";
    const testResponse = "testResponse";

    test("returns the user prompts & replies if available", () => {
      openAiManager._cache = { [userName]: { [testPrompt]: testResponse } };

      const messages = openAiManager.getUserHistory(userName);
      assert.deepEqual(messages, [[testPrompt, testResponse]]);
    });

    test("doesn't return the wrong user's chats", () => {
      openAiManager._cache = { [userName]: { [testPrompt]: testResponse } };

      const messages = openAiManager.getUserHistory("faulty user name");
      assert.deepEqual(messages, []);
    });
  });
});

describe("_getUserChats", () => {
  const userName = "userName";
  const testPrompt = "testPrompt";
  const testResponse = "testResponse";

  /** @type {OpenAiManager} */
  let openAiManager;

  beforeEach(() => {
    openAiManager = new OpenAiManager(RANDOM_KEY);

    openAiManager._cache = { [userName]: { [testPrompt]: testResponse } };
  });

  test("returns an empty string when no user is provided", () => {
    const userChats = openAiManager._getUserChats();
    assert.deepEqual(userChats, "");
  });

  test("returns an empty string when non-existant user is provided", () => {
    const userChats = openAiManager._getUserChats("faulty user");
    assert.deepEqual(userChats, "");
  });

  test("returns the past user chats as a string", () => {
    const userChats = openAiManager._getUserChats(userName);
    assert.ok(userChats.includes(testPrompt));
    assert.ok(userChats.includes(testResponse));
  });

  test("the userChats contains the appropriate number of Q: and A: ", () => {
    const userChats = openAiManager._getUserChats(userName);

    const historyLength = Object.keys(openAiManager._cache[userName]).length;

    const qCount = (userChats.match(new RegExp("Q: ", "g")) || []).length;
    const aCount = (userChats.match(new RegExp("A: ", "g")) || []).length;
    assert.ok(qCount >= historyLength);
    assert.ok(aCount >= historyLength);
  });
});

// describe("_constructMessage", () => {
//   /** @type {OpenAiManager} */
//   let openAiManager;

//   beforeEach(() => {
//     openAiManager = new OpenAiManager("1234");
//   });

//   test("there are the correct number of system, assistant and user messages for a given user prompt", () => {
//     const userChats

//   });
// });
