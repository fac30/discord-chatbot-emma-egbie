
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
  }

  /**
   * Gets a response from chatgpt for a given prompt.
   * Caches previous responses.
   * Doesn't allow too frequent calls to prevent spam.
   * @param {string} userPrompt
   * @returns
   */
  async prompt(userPrompt, user = "default") {

    // if we previously have a response, we return it instead
    if (this._cache[user]?.[userPrompt] !== undefined) {
      return this._cache[user][userPrompt];
    }

    const timeNow       = Date.now();
    const waitTimeLimit = 3000;      //  variable name so it does look like a "magic number" known in programming

   
    //we don't submit a prompt unless it's been more than 3 seconds.
    if (this._lastMessageTime && (timeNow - this._lastMessageTime < waitTimeLimit)) {
      return "";
    }

    const messages  = this._constructMessage(userPrompt, user);
    const result    = await this._generateReply(messages);

    this._updateCache(user, userPrompt, result);
    this._updateLastMessageTime(timeNow);

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

    return messages
  }

  /**
   * Generates a reply from OpenAI based on the provided messages.
   * @param {Array<{ role: string, content: string }>} messages - The messages to send to OpenAI.
   * @returns {Promise<string>} A promise that resolves to the generated response from OpenAI.
   */  
  async _generateReply(messages) {
    const completion = await this._openAi.chat.completions.create({
      messages,
      model: "gpt-3.5-turbo",
    });

    return completion.choices[0].message.content || '';
  }


  /**
   * Updates the cache with the result of a prompt.
   * @param {string} user - The user's identifier.
   * @param {string} userPrompt - The prompt provided by the user.
   * @param {string} result - The generated response from OpenAI.
   */
  _updateCache(user, userPrompt, result) {
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
   */
  _getUserChats(user = "default") {
    return this._cache[user]
      ? Object.entries(this._cache[user])
          .map(([prompt, response]) => {
            return `Q: ${prompt}, A: ${response}`;
          })
          .join(" ")
      : "";
  }

  setName(name) {
    this.name = name;
  }
}

module.exports = OpenAiManager;

