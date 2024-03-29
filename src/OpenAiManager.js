const { OpenAI } = require("openai");

// These prompts happen before each message under the 'system' role
const systemPrompts = [
  "You are a helpful assistant.",
  "You try to give the shortest but friendliest reply possible.",
  "You are in a chatroom on discord, and you try to answer each user's question(s) individually.",
  "You may or may not have access to the user's previous chats.",
  "Do not refer to anyone by their name under any circumstances, unless it's very relevant to the prompt.",
];

/**
 *
 */
class OpenAiManager {
  constructor(apiKey) {
    /** @private */
    this._openAi = new OpenAI({ apiKey });
    this._cache = {};
    this.name = "discord chatbot";
    this._lastMessageTime = null;

    /** @private */
    this.waitTimeLimit = 3000;
  }

  /**
   * Gets a response from chatgpt for a given prompt.
   * Caches previous responses.
   * Doesn't allow too frequent calls to prevent spam.
   * Handles errors
   * @param {string} userPrompt prompt of the user (their message to the chatbot)
   *  @param {string} userName username
   * @returns {Promise<string}
   */
  async prompt(userPrompt, userName) {
    try {
      // if we previously have a response, we return it instead
      if (this._cache[userName]?.[userPrompt] !== undefined) {
        return this._cache[userName][userPrompt];
      }

      const timeNow = Date.now();
      //  variable name so it does look like a "magic number" known in programming

      //we don't submit a prompt unless it's been more than 3 seconds.
      if (this._lastMessageTime && timeNow - this._lastMessageTime < this.waitTimeLimit) {
        return "";
      }

      const messages = this._constructMessage(userPrompt, userName);
      const result = await this._generateReply(messages);
      this.updateCache(userName, userPrompt, result);
      this._updateLastMessageTime(timeNow);

      return result;
    } catch (error) {
      console.error("Error occurred during prompt:", error);
      // Handle the error, perhaps by providing a fallback response or informing the user.
      return "Sorry, something went wrong. Please try again later.";
    }
  }

  /**
   * Runs the user prompt through the moderations api.
   * @param {string} userPrompt
   * @returns {Promise<string[]>}
   */
  async moderatePrompt(userPrompt) {
    const moderationPayload = await this._openAi.moderations.create({
      input: userPrompt,
      model: "text-moderation-stable",
    });

    const violationCategories = moderationPayload.results[0].categories;
    return Object.entries(violationCategories)
      .filter(([, value]) => value)
      .map(([key]) => key);
  }

  /**
   * Builds an array of messages to send to OpenAI based on the user prompt and previous chats.
   * @param {string} userPrompt - The prompt provided by the user.
   * @param {string} user - The user's identifier.
   * @returns {Array<{ role: string, content: string }>} An array of messages for OpenAI.
   */
  _constructMessage(userPrompt, user) {
    const previousChats = this._getUserChats(user);

    const messages = [
      { role: "system", content: `Your name is ${this.name} and ${this.name} only. ` },
      { role: "system", content: systemPrompts.join(" ") },
      { role: "assistant", content: `This user is called ${user}. Do NOT mention their name.",` },
    ];

    // we provide the chat history of a user if they exist.
    if (previousChats) {
      messages.push({
        role: "assistant",
        content: `The previous conversations with this user are: ${previousChats}. Don't greet them again.`,
      });
    }

    messages.push({
      role: "user",
      content: `${user} writes: ${userPrompt}.`,
    });

    return messages;
  }

  /**
   * Generates a reply from OpenAI based on the provided messages.
   * @param {Array<{ role: string, content: string }>} messages - The messages to send to OpenAI.
   * @returns {Promise<string>} A promise that resolves to the generated response from OpenAI.
   */
  async _generateReply(messages) {
    try {
      const completion = await this._openAi.chat.completions.create({
        messages,
        model: "gpt-3.5-turbo",
      });

      return completion.choices[0].message.content || "";
    } catch (error) {
      throw new Error("Error while generating reply:", error);
    }
  }

  /**
   * Updates the cache with the result of a prompt.
   * @param {string} user - The user's identifier.
   * @param {string} userPrompt - The prompt provided by the user.
   * @param {string} result - The generated response from OpenAI.
   */
  updateCache(user, userPrompt, result) {
    if (!this._cache[user]) {
      this._cache[user] = {};
    }
    this._cache[user][userPrompt] = result;
  }

  /**
   * Updates the last message time to the current timestamp.
   */
  _updateLastMessageTime(currentTime) {
    this._lastMessageTime = currentTime;
  }

  /**
   * Gets all the user chat history
   * @param { string } user - username
   * @returns all the user chat history with the bot as a single string.
   * @private
   */
  _getUserChats(user) {
    return this.getUserHistory(user)
      .map(([prompt, response]) => `Q: ${prompt}, A: ${response}`)
      .join(" ");
  }

  /**
   * Gets all the user chat history
   * @param { string } user - username
   * @returns all the user chat history with the bot as a single string.
   */
  getUserHistory(user) {
    return this._cache[user] ? Object.entries(this._cache[user]) : [];
  }

  setName(name) {
    this.name = name;
  }
}

module.exports = OpenAiManager;
