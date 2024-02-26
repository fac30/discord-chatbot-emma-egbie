const assert = require("assert");
const dotenv = require("dotenv").config();

const { test, describe, beforeEach } = require("node:test");
const OpenAiManager = require("../src/OpenAiManager");

const openAiMockResponse = require("./openAiMock.json");

const API_TEST_KEY = "123";

describe("environment variables", () => {
  test("has values for the necessary environment variables, loaded from the .env file", () => {
    const OPEN_AI_KEY = dotenv.parsed.OPEN_AI_KEY;
    assert.ok(OPEN_AI_KEY.length > 0);
  });

  test("OpenAI instance has the same value key as the one passed in the constructor", () => {
    const OPEN_AI_KEY = dotenv.parsed.OPEN_AI_KEY;
    const openAiManager = new OpenAiManager(OPEN_AI_KEY);
    assert.deepEqual(OPEN_AI_KEY, openAiManager._openAi.apiKey);
  });
});

describe("getUserHistory", () => {
  /** @type {OpenAiManager} */
  let openAiManager;

  beforeEach(() => {
    openAiManager = new OpenAiManager(API_TEST_KEY);
  });

  test("returns an empty list when there's no user history", () => {
    const messages = openAiManager.getUserHistory();
    assert.deepEqual(messages, []);
  });

  describe("existing user", () => {
    const userName = "userName";
    const testPrompt = "testPrompt";
    const testResponse = "testResponse";

    beforeEach(() => {
      openAiManager._cache = { [userName]: { [testPrompt]: testResponse } };
    });
    test("returns the user prompts & replies if available", () => {
      const messages = openAiManager.getUserHistory(userName);
      assert.deepEqual(messages, [[testPrompt, testResponse]]);
    });

    test("doesn't return the wrong user's chats", () => {
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
    openAiManager = new OpenAiManager(API_TEST_KEY);

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

describe("_constructMessage", () => {
  /** @type {OpenAiManager} */
  let openAiManager;

  function countUserPrompts(apiMessages) {
    let systemMessagesCount = 0;
    let assistantMessagesCount = 0;
    let userMessagesCount = 0;

    apiMessages.forEach(({ role }) => {
      switch (role) {
        case "system":
          return systemMessagesCount++;
        case "assistant":
          return assistantMessagesCount++;
        case "user":
          return userMessagesCount++;
      }
    });

    return { systemMessagesCount, assistantMessagesCount, userMessagesCount };
  }
  beforeEach(() => {
    openAiManager = new OpenAiManager(API_TEST_KEY);
  });

  test("there are the correct number of system, assistant and user messages for a given user prompt", () => {
    const userName = "userName";
    const testPrompt = "testPrompt";
    const testResponse = "testResponse";

    openAiManager._cache = { [userName]: { [testPrompt]: testResponse } };

    const { systemMessagesCount, assistantMessagesCount, userMessagesCount } = countUserPrompts(
      openAiManager._constructMessage("prompt", userName)
    );

    assert.deepEqual(systemMessagesCount, 2);
    assert.deepEqual(assistantMessagesCount, 2);
    assert.deepEqual(userMessagesCount, 1);
  });

  test("there are the correct number of system, assistant and user messages for a given user prompt, when the user has history", () => {
    const testUser = "testUser";
    const testPrompt = "testPrompt";

    const { systemMessagesCount, assistantMessagesCount, userMessagesCount } = countUserPrompts(
      openAiManager._constructMessage(testPrompt, testUser)
    );

    assert.deepEqual(systemMessagesCount, 2);
    assert.deepEqual(assistantMessagesCount, 1);
    assert.deepEqual(userMessagesCount, 1);
  });
});

describe("_generateReply", () => {
  /** @type {OpenAiManager} */
  let openAiManager;

  const mockOpenAi = (promise) => {
    openAiManager._openAi = { chat: { completions: { create: () => promise } } };
  };

  beforeEach(() => {
    openAiManager = new OpenAiManager(API_TEST_KEY);
  });

  test("extracts reply correctly from openAi response", async () => {
    mockOpenAi(
      new Promise((resolve) => {
        resolve(openAiMockResponse);
      })
    );
    const reply = await openAiManager._generateReply([]);

    assert.deepEqual(reply, openAiMockResponse.choices[0].message.content);
  });

  test("returns empty string when api call fails", async () => {
    mockOpenAi(
      new Promise((resolve, reject) => {
        reject();
      })
    );

    const reply = await openAiManager._generateReply([]);
    assert.deepEqual(reply, "");
  });
});

describe("prompt", () => {});
