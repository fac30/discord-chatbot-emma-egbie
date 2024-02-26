const assert = require("assert");
const dotenv = require("dotenv").config();

const { test, describe, beforeEach } = require("node:test");
const OpenAiManager = require("../../src/OpenAiManager");

const openAiMockCompletion = require("./openAiCompletionsMock.json");

const openAiMockModeration = require("./openAiModerationsMock.json");

const API_TEST_KEY = "123";

const userName = "userName";
const userPrompt = "userPrompt";
const openaiResponse = "openaiResponse";

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

describe("OpenAiManager methods", () => {
  /** @type {OpenAiManager} */
  let openAiManager;

  /**
   * a way to mock the openAi package to return custom promises.
   */
  const mockOpenAi = ({ completionsPromise, moderationsPromise }) => {
    openAiManager._openAi = {
      chat: {
        completions: { create: () => completionsPromise },
      },
      moderations: { create: () => moderationsPromise },
    };
  };

  beforeEach(() => {
    openAiManager = new OpenAiManager(API_TEST_KEY);
  });

  describe("getUserHistory", () => {
    test("returns an empty list when there's no user history", () => {
      const messages = openAiManager.getUserHistory();
      assert.deepEqual(messages, []);
    });

    describe("existing user", () => {
      beforeEach(() => {
        openAiManager._cache = { [userName]: { [userPrompt]: openaiResponse } };
      });

      test("returns the user prompts & replies if available", () => {
        const messages = openAiManager.getUserHistory(userName);
        assert.deepEqual(messages, [[userPrompt, openaiResponse]]);
      });

      test("doesn't return the wrong user's chats", () => {
        const messages = openAiManager.getUserHistory("faulty user name");
        assert.deepEqual(messages, []);
      });
    });
  });

  describe("_getUserChats", () => {
    beforeEach(() => {
      openAiManager._cache = { [userName]: { [userPrompt]: openaiResponse } };
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
      assert.ok(userChats.includes(userPrompt));
      assert.ok(userChats.includes(openaiResponse));
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

    test("there are the correct number of system, assistant and user messages for a given user prompt", () => {
      const { systemMessagesCount, assistantMessagesCount, userMessagesCount } = countUserPrompts(
        openAiManager._constructMessage("somePrompt", "testUser")
      );

      assert.deepEqual(systemMessagesCount, 2);
      assert.deepEqual(assistantMessagesCount, 1);
      assert.deepEqual(userMessagesCount, 1);
    });

    test("there are the correct number of system, assistant and user messages for a given user prompt, when the user has history", () => {
      openAiManager._cache = { [userName]: { [userPrompt]: openaiResponse } };

      const { systemMessagesCount, assistantMessagesCount, userMessagesCount } = countUserPrompts(
        openAiManager._constructMessage("prompt", userName)
      );

      assert.deepEqual(systemMessagesCount, 2);
      assert.deepEqual(assistantMessagesCount, 2);
      assert.deepEqual(userMessagesCount, 1);
    });
  });

  describe("_generateReply", () => {
    test("extracts reply correctly from openAi response", async () => {
      mockOpenAi({
        completionsPromise: new Promise((resolve) => {
          resolve(openAiMockCompletion);
        }),
      });
      const reply = await openAiManager._generateReply([]);

      assert.deepEqual(reply, openAiMockCompletion.choices[0].message.content);
    });

    test("returns empty string when api call fails", async () => {
      mockOpenAi({
        completionsPromise: new Promise((resolve, reject) => {
          reject();
        }),
      });

      assert.rejects(async () => await openAiManager._generateReply([]));
    });
  });

  describe("updateCache", () => {
    beforeEach(() => {
      openAiManager = new OpenAiManager(API_TEST_KEY);
    });

    beforeEach(() => {
      openAiManager.updateCache(userName, userPrompt, openaiResponse);
    });

    test("creates a new cache entry for a new user", () => {
      assert.deepEqual(openAiManager._cache[userName][userPrompt], openaiResponse);
    });

    test("updates the cache cache entry for an existing user", () => {
      const secondTestPrompt = "secondTestPrompt";
      const secondTestResponse = "secondTestResponse";
      openAiManager.updateCache(userName, secondTestPrompt, secondTestResponse);
      assert.deepEqual(openAiManager._cache.userName.secondTestPrompt, secondTestResponse);
    });
  });

  describe("_updateLastMessageTime", () => {
    beforeEach(() => {
      openAiManager = new OpenAiManager(API_TEST_KEY);
    });
    test("lastMessageTime is null to begin with", () => {
      assert.deepEqual(openAiManager._lastMessageTime, null);
    });

    test("lastMessageTime is null to begin with", () => {
      const timeNow = Date.now();
      openAiManager._updateLastMessageTime(timeNow);
      assert.deepEqual(openAiManager._lastMessageTime, timeNow);
    });
  });

  describe("moderatePrompt", () => {
    beforeEach(() => {
      openAiManager = new OpenAiManager(API_TEST_KEY);
    });

    test("returns all flagged moderation keywords", async () => {
      mockOpenAi({
        moderationsPromise: new Promise((resolve) => {
          resolve(openAiMockModeration);
        }),
      });
      const reply = await openAiManager.moderatePrompt();

      const flaggedKeys = Object.entries(openAiMockModeration.results[0].categories).filter(
        ([entry, value]) => !!value
      );
      assert.deepEqual(reply.length, flaggedKeys.length);
    });
  });

  describe("prompt", () => {
    // on success

    beforeEach(() => {
      openAiManager = new OpenAiManager(API_TEST_KEY);
    });

    test("message is returned, cache and time are updated", async () => {
      mockOpenAi({
        completionsPromise: new Promise((resolve) => {
          resolve(openAiMockCompletion);
        }),
      });

      const mockResponse = openAiMockCompletion.choices[0].message.content;
      const response = await openAiManager.prompt(userPrompt, userName);
      assert.deepEqual(response, mockResponse);
      assert.deepEqual(openAiManager._cache[userName][userPrompt], mockResponse);
      assert.ok(openAiManager._lastMessageTime !== null);
    });

    /**
     * This function relies on the fact that when a new prompt is given, the _lastMessageTime isn't updated.
     * This means that if we pass the same prompt, from the same user, the _lastMessageTime won't be updated.
     */
    test("same message is returned from cache instead of passed through openAi", async () => {
      mockOpenAi({
        completionsPromise: new Promise((resolve) => {
          resolve(openAiMockCompletion);
        }),
      });

      openAiManager.waitTimeLimit = 0;
      await openAiManager.prompt(userPrompt, userName);

      const time = openAiManager._lastMessageTime;

      await openAiManager.prompt(userPrompt, userName);
      assert.ok(openAiManager._lastMessageTime === time);
    });

    test("spam prevention mechanism prevents sending messages for more than 3 seconds", async () => {
      mockOpenAi({
        completionsPromise: new Promise((resolve) => {
          resolve(openAiMockCompletion);
        }),
      });

      await openAiManager.prompt(userPrompt, userName);

      const response = await openAiManager.prompt(userPrompt + userPrompt, userName);
      assert.deepEqual(response, "");
    });

    test("when fails, returns the 'sorry' message", async () => {
      mockOpenAi({
        completionsPromise: new Promise((resolve, reject) => {
          reject();
        }),
      });
      const response = await openAiManager.prompt(userPrompt, userName);
      assert.deepEqual(response, "Sorry, something went wrong. Please try again later.");
    });
  });
});
