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

    const now = Date.now();
    // we don't submit a prompt unless it's been more than 3 seconds.
    if (this._lastMessageTime && now - this._lastMessageTime < 3000) {
      // maybe we can add some default 'please wait' thingy here
      return "";
    }
    try {
      const messages = [
        { role: "system", content: `Your name is ${this.name} and ${this.name} only. ` },
        { role: "system", content: systemPrompts.join(" ") },
        { role: "assistant", content: `This user is called ${user}. Do NOT mention their name.",` },
      ];

      const previousChats = this._getUserChats(user);

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

      const completion = await this._openAi.chat.completions.create({
        messages,
        model: "gpt-3.5-turbo",
      });

      const result = completion.choices[0].message.content;
      if (!this._cache[user]) {
        this._cache[user] = {};
      }
      this._cache[user][userPrompt] = result;
      this._lastMessageTime = now;
      return result;
    } catch (e) {
      // maybe we want to throw this error instead of catching it?
      // or return some error text?
      return "";
    }
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
