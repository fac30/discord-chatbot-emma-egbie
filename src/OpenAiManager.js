const { OpenAI } = require("openai");

const systemPrompts = [
  "You are a helpful assistant.",
  "You try to give the shortest but friendliest reply possible.",
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
  async prompt(userPrompt) {
    // if we previously have a response, we return it instead
    if (this._cache[userPrompt] !== undefined) {
      return this._cache[userPrompt];
    }

    const now = Date.now();
    // we don't submit a prompt unless it's been more than 3 seconds.
    if (this._lastMessageTime && now - this._lastMessageTime < 3000) {
      // maybe we can add some default 'please wait' thingy here
      return "";
    }

    try {
      const completion = await this._openAi.chat.completions.create({
        messages: [
          {
            role: "system",
            content: [`Your name is ${this.name} and ${this.name} only. `, ...systemPrompts].join(
              " "
            ),
          },
          { role: "user", content: userPrompt },
        ],
        model: "gpt-3.5-turbo",
      });

      const result = completion.choices[0].message.content;
      this._cache[userPrompt] = result;
      this._lastMessageTime = now;
      return result;
    } catch (e) {
      // maybe we want to throw this error instead of catching it?
      // or return some error text?
      return "";
    }
  }

  setName(name) {
    this.name = name;
  }
}

module.exports = OpenAiManager;
