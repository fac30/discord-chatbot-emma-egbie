const {
  Client,
  GatewayIntentBits,
  Events,
  EmbedBuilder,
  TextChannel,
  Message,
  GuildMember,
  User,
} = require("discord.js");

const OpenAiManager = require("./OpenAiManager");
const { changeStringToTitle, parseUserMentionAndMessage } = require("./utils.js");

/**
 * Represents a manager for a Discord bot, responsible for initializing the bot,
 * handling events such as new member announcements, and sending messages to Discord channels.
 */
class BotManager {
  /**
   * Constructs a new BotManager instance with the specified Discord bot token and server ID.
   * @param {string} discordBotToken - The Discord bot token used for authentication.
   * @param {string} server_ID - The ID of the server where the bot will operate.
   */
  constructor(discordBotToken, server_ID, openai_KEY) {
    /** @private */
    this._showHistoryCommand = "!showMyChatHistory";
    /** @private */
    this._excludeArray = [this._showHistoryCommand];
    /** @private */
    this.strikeInterval = 3;

    /** @private */
    this._client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
      
      ],
    });

    this._openAi = new OpenAiManager(openai_KEY);
    /** @private */
    this._discordBotToken = discordBotToken;
    /** @private */
    this._serverID = server_ID;
    /** @private */
    this._initialized = false;
    /** @private */
    this._lastMessageTime;
    /**@private */
    this._userStrikes = {};
    this.botName = null;

    // hook up event listeners here

    this._client.on(Events.MessageCreate, this._onMessageCreate.bind(this));
    this._client.on(Events.GuildMemberAdd, this._announceNewMember.bind(this));
    this._client.on(Events.GuildMemberRemove, this._announceMemberLeave.bind(this));
  
  }


  /**
 * Logs the bot into Discord.
 * 
 * @returns {Promise} A promise that resolves when the bot is initialized, or rejects if login fails.
 */
  login() {
    if (this._initialized) {
      return Promise.resolve(); // Resolve immediately if already initialized
    }

    return new Promise((resolve, reject) => {
      this._client.once(Events.ClientReady, () => {

        this._initialized = true;
        const botName = this._client.user.displayName;
        this._openAi.setName(botName); //set to the openAi class
        this.setBotname(botName);      // set to the botManager class 
        this._announcePresence();
        resolve();
      });

      // Login to Discord
      this._client.login(this._discordBotToken)
        .catch(reject);
    });
  }

  /**
   * Announces the bot's presence by sending a message in the default channel
   * @private
   */
  async _announcePresence() {

    const msg =
      `Hello everyone! I'm the **${this.botName}**, now online and ready to chat. To chat with me, ` +
      `**type @${this.botName} followed by your prompt**. ` +
      `To see your history, **type @${this.botName} ${this._showHistoryCommand}** ` +
      `and to send a **DM (direct message)** to the user type **@<username>  followed by your message**`;

    return await this._sendToChannel(this.defaultChannel, msg);
  }

  /**
   * Runs whenever a message is written in the chat
   * Doesn't reply to messages all the time, only if it hasn't replied in the last 3 seconds.
   * Check if the user is not a bot and if not
   * parses a 'user mention' and message from the given content from.
   * Listens for a command in the format "@<username> <message>" on Discord,
   * where the first part specifies the user you want to send the message to,
   * and the second part is the message content.
   * For example, if a user enters "@peter123 this is a test",
   * the function parses the username and message,
   * then sends the message to the mentioned user if found.
   * If the command is not entered, or if the content is not in the expected format,
   * the function takes no action and continues with the rest of the code.
   * @param { Message } message
   * @private
   */
  async _onMessageCreate(message) {
    const author = message.author.id;
    const content = message.content;
    const hasBeenMentioned = message.mentions.has(this._client.user.id);
    const isSameAuthor = author === this._client.application.id;
    const currentTime = Date.now();
    const waitTimeLimit = 3000;

    const hasTalkedRecently =
      this._lastMessageTime && currentTime - this._lastMessageTime < waitTimeLimit;

    const { userId, messageContent } = parseUserMentionAndMessage(content);
    let isDirectMessage = userId != this._client.application.id && messageContent && !this._isTextInExcludeList(messageContent);

    if (author !== this._client.application.id) {

      // Only respond to messages where the bot's name is mentioned directly.
      // If the message includes a mention of the bot's name, proceed with the necessary actions otherwise do nothing.
      if (userId != null) {
        this._moderateUserPrompt(content, message, isDirectMessage);
      }
     
      switch (true) {
        case isDirectMessage:
          this._sendDirectMessageToUser(userId, messageContent);
          break;

        case messageContent && messageContent.trim() === this._showHistoryCommand:
          await this._showUserChatHistory(message, currentTime);
          break;
      }
    }

    //  We don't send a message if:
    // - we sent the last message
    // - we haven't been mentioned in the last message
    // - we already replied in the last 3 seconds
    //
    // The line has to be at the bottom because if it is at the top, it prevents the other actions from executing.
    // This is because it checks if the user has already been interacted with (talked to, mentioned, or talked to recently),
    // and if so, the preceding if statement is not triggered. This means that the actions involving OpenAI, sending messages,
    // and showing history are delayed until after a 3 seconds since there are not called because of the return statement.
    if (isSameAuthor || hasTalkedRecently || !hasBeenMentioned) {
      return;
    }
  }

  /**
   * Monitors user content for moderation and takes action accordingly.
   *
   * @param {string} content - The content to monitor.
   * @param {Message} message - The message object representing the context of the command.
   * @param {boolean} [isDirectMessage=false] - Flag indicating whether the content should be sent as a direct message to a user.
   * @returns {Promise<void>} - A Promise that resolves when the monitoring process is complete.
   */
  async _moderateUserPrompt(content, message, isDirectMessage = false) {
    const moderations = await this._openAi.moderatePrompt(content);
    const messageContent = parseUserMentionAndMessage(content).messageContent;

    if (moderations.length) {
      this._sendWarningModerationMessage(moderations.join(", "), message.author, messageContent);
      this._deleteMsg(message);
      return;
    }

    if (!isDirectMessage && !this._isTextInExcludeList(messageContent)) {
      return await this._queryOpenAi(messageContent, message);
    }
  }

  /**
   * Sends
   * @param {string} moderations
   * @param {User} user
   * @param {string} messageContent
   */
  _sendWarningModerationMessage(moderations, user, messageContent) {
    this._strikeUser(user);
    const moderationMessage = `Your message has been flagged for: ${moderations}. Sending messages which violate OpenAI's terms of use will result in a ban`;

    this._sendToChannel(this.defaultChannel, moderationMessage);
    this._openAi.updateCache(user.username, messageContent, moderationMessage);
  }

  /**
   * @param {User} user
   */
  async _strikeUser(user) {
    const username = user.username;
    this._userStrikes[username] = this._userStrikes[username] ?? 0;
    this._userStrikes[username]++;

    // if the user exceed the strike interval, and for every time they exceed it
    if (
      this._userStrikes[username] > this.strikeInterval &&
      this._userStrikes[username] % this.strikeInterval === 1
    ) {
      const member = await this.guild.members.fetch({ user });
      try {
        // increments the time the user is timed out for depending of how many strikes they have.
        // but it doesn't exceed one hour.
        const timeoutDuration = Math.min(this.strikeInterval ** 2 * 1000, 3600 * 1000);
        return await member.timeout(timeoutDuration, "Violating speech terms.");
      } catch (e) {
        console.error(
          "Cannot timeout member. Could be because member has a higher role than the bot."
        );
      }
    }
  }

  /**
   * Sends a direct message to a user identified by their user ID.
   * @param {string} userID - The ID of the user to whom the message will be sent.
   * @param {string} message - The content of the message to be sent.
   */
  _sendDirectMessageToUser(userID, message) {
    const user = this._client.users.cache?.get(userID);

    if (!user) {
      console.log(`User with ID ${userID} does not exist.`);
      return;
    }

    user.send(message)
      .then(() => {
        console.log("The message was sent successfully.");
      })
      .catch(() => {
        console.log("Failed to send the message.");
      });
  }

  /**
   * Queries the OpenAI API with the provided prompt and sends the response to the message channel.
   *
   * @param {string} prompt - The prompt to query the OpenAI API.
   * @param {Message} message - The Discord message object representing the message triggering the query.
   */
  async _queryOpenAi(prompt, message) {
    this._showBotTyping(message);
    const waitMsg = await this._sendToChannel(
      this.defaultChannel,
      "Fetching response, please wait...."
    );

    this._openAi.prompt(prompt, message.author.username).then((reply) => {
      if (!reply || (reply && !reply.length)) {
        this._sendToChannel(
          message.channel,
          `<@${message.author.id}> Failed to fetch your response!!!}`
        );
      }

      this._sendToChannel(message.channel, `\n <@${message.author.id}> ${reply}`);

      waitMsg.delete(); // delete the message once the we get data or regardless whether we get the data
    });
  }

  /**
   * Displays the chat history of the user who triggered the command in an embedded format.
   * If there's no chat history available, sends a message indicating so.
   * Users can request their entire chat history by issuing the command "!showMyChatHistory" in Discord.
   *
   * @param {Message} message The message object representing the command invocation.
   * @param {number} currentTime the current time
   * @returns {Promise<void>} A promise that resolves once the chat history is displayed.
   */
  async _showUserChatHistory(message, currentTime) {
    const chatHistory = this._openAi.getUserHistory(message.author.username);

    this._showBotTyping(message);

    // Check if there's no chat history available
    if (!chatHistory.length) {
      return await this._sendToChannel(this.defaultChannel, "There are no chats to view!");
    }

    const loadingMessage = await this._sendToChannel(
      this.defaultChannel,
      `Fetching chat history from ${message.author.username}'s account...`
    );

    const popupEmbed = await this._createEmbeddedChatHistory(chatHistory, message, currentTime);
    await loadingMessage.edit({ content: "Here is your chat history:", embeds: [popupEmbed] });
  }

  /**
   * Creates an embedded representation of the provided chat history.
   * @param {string[][]} chatHistory The chat history to be embedded.
   * @param {Message} message The message object used for context, such as the author's username.
   * @param {number} currentTime the current time
   * @returns {Promise<MessageEmbed>} A promise that resolves with the embedded chat history.
   */
  async _createEmbeddedChatHistory(chatHistory, message, currentTime) {
    // Extract question-answer pairs from the chat history
    const fields = this._generateFieldsFromQAPairs(chatHistory);

    // Create the embedded message
    const popupEmbed = new EmbedBuilder()
      .setTitle("User Chat History")
      .setAuthor({ name: `Bot name: ${this._openAi.name}` })
      .setColor("DarkRed")
      .setTimestamp(currentTime)
      .setFooter({ text: message.author.username })
      .addFields(fields);

    return popupEmbed;
  }

  /**
   * Generates fields from question-answer pairs.
   * @param {[string, string][]} qaPairs - An array of question-answer pairs.
   * @returns {Object[]} An array of field objects.
   * @private
   */
  _generateFieldsFromQAPairs(qaPairs) {
    const fields = [];

    // Iterate over each question-answer pair and add them as fields to the array
    qaPairs.forEach(([question, answer]) => {
      // Create an object representing a field and push it to the fields array
      fields.push({
        name: `Q:  ${changeStringToTitle(question)}`,
        value: `**A: **  ${answer}`,
        inline: false,
      });

      fields.push({ name: "\u200b", value: "\u200b" }); // Empty field for line break
    });
    return fields;
  }
  /**
   * Sends a welcome message to the system channel announcing the new member.
   * @param { GuildMember } member
   * @private
   */
  _announceNewMember(member) {
    const message = `Welcome to the server, ${member.user.tag}!`;
    this._sendToChannel(this.defaultChannel, message);
  }

  /**
   * Sends a message to the system channel announcing the member's departure.
   * @param { GuildMember } member
   * @private
   */
  _announceMemberLeave(member) {
    const message = `${member.user.tag} has left the server`;
    this._sendToChannel(this.defaultChannel, message);
  }

  /**
   * Sends a message to the specified Discord server channel.
   * @param {TextChannel} channel - The Discord server channel to send the message to.
   * @param {string} message - The message content to send.
   * @private
   */
  async _sendToChannel(channel, message) {
    try {
      if (!channel) {
        throw new Error("Channel not found!!");
      }

      return await channel.send(message);
    } catch (error) {
      console.error("Error sending message:", error.message);
      return "";
    }
  }

  /**
   * Asynchronously displays typing status for the bot in the given message's channel.
   *
   * @param {Message} message - The message object representing the context of the command.
   * @returns {Promise<void>} - A Promise that resolves when the typing status is displayed.
   */
  async _showBotTyping(message) {
    await message.channel.sendTyping();
  }

  /**
   * Checks if a given text is included in the exclusion list.
   *
   * @param {string} text - The text to check against the exclusion list.
   * @returns {boolean} - Returns true if the text is found in the exclusion list, false otherwise.
   */
  _isTextInExcludeList(text) {
    return this._excludeArray.includes(text);
  }

  /**
   * Deletes a message and sends a reason to the default channel.
   * @param {Message} message - The message object to delete.
   * @param {string} [default string - reason="Your message has been deleted because it violates OpenAi rules"] .
   */
  _deleteMsg(message, reason = "Your message has been deleted because it violates OpenAi rules") {
    if (message) {
      message
        .delete()
        .then(() => {
          this._sendToChannel(this.defaultChannel, reason);
        })
        .catch((error) => {
          console.error("Error deleting message:", error);
        });
    }
  }

  /**
   * logs the bot out of the server
   */
  async logout() {
    try {
      if (this._client) {
        await this._client.destroy();
      }
      
      console.log("Bot logged out successfully.");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  }
  /**
   * Sets the name of the bot to the botManager class.
   * 
   * @param {string} botName - The name to set for the bot.
   */
  setBotname(botName) {
    this.botName = botName;
  }

  get defaultChannel() {
    return this.guild && this.guild.id === this._serverID ? this.guild?.systemChannel : null;
  }

  get guild() {
    return this._client.guilds.cache.get(this._serverID);
  }
}

module.exports = BotManager;
