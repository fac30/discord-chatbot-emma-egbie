const {
  Client,
  GatewayIntentBits,
  Events,
  TextChannel,
  Message,
  GuildMember,
  EmbedBuilder,
  User,
} = require("discord.js");

const OpenAiManager = require("./OpenAiManager");
const { changeStringToTitle, parseUserMentionAndMessage } = require("./utils.js");

const showHistoryCommand = "!showMyChatHistory";
const strikeInterval = 3;
const currentTimeNow = Date.now();

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

    // hook up event listeners here
    this._client.on(Events.MessageCreate, this._onMessageCreate.bind(this));
    this._client.on(Events.GuildMemberAdd, this._announceNewMember.bind(this));
    this._client.on(Events.GuildMemberRemove, this._announceMemberLeave.bind(this));
  }

  /**
   * Logs the bot in.
   * Sends a greeting message to the system channel of the server when the bot connects to Discord for the first time.
   */
  login() {
    if (this._initialized) {
      return;
    }

    this._client.once(Events.ClientReady, () => {
      this._initialized = true;
      this._openAi.setName(this._client.user.displayName);
      this._announcePresence();
    });

    this._client.login(this._discordBotToken);
  }

  /**
   * Announces the bot's presence by sending a message in the default channel
   * @private
   */
  _announcePresence() {
    const botName = this._client.user.displayName;
    const msg = `Hello everyone! I'm the ${botName}, now online and ready to chat. To chat with me, type @${botName} followed by your prompt. To see your history, type @${botName} ${showHistoryCommand}.`;
    this._sendToChannel(this.defaultChannel, msg);
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
    const waitTimeLimit = 3000;

    const hasTalkedRecently =
      this._lastMessageTime && Date.now() - this._lastMessageTime < waitTimeLimit;

    //  We don't send a message if:
    // - we sent the last message
    // - we haven't been mentioned in the last message
    // - we already replied in the last 3 seconds
    if (isSameAuthor || hasTalkedRecently || !hasBeenMentioned) {
      return;
    }
    const { messageContent } = parseUserMentionAndMessage(content);
    if (messageContent.trim() === showHistoryCommand) {
      // checks for the phrase "!showMyChatHistory" in order to display the user's history
      this._showUserChatHistory(message);
      return;
    }

    const moderations = await this._openAi.moderatePrompt(content);

    if (moderations.length) {
      this._sendWarningModerationMessage(moderations.join(", "), message.author, messageContent);
    } else {
      this._queryOpenAi(messageContent, message);
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
      this._userStrikes[username] > strikeInterval &&
      this._userStrikes[username] % strikeInterval === 1
    ) {
      const member = await this.guild.members.fetch({ user });
      try {
        // increments the time the user is timed out for depending of how many strikes they have.
        // but it doesn't exceed one hour.
        const timeoutDuration = Math.min(strikeInterval ** 2 * 1000, 3600 * 1000);
        await member.timeout(timeoutDuration, "Violating speech terms.");
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

    user
      .send(message)
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
   * @returns {Promise<void>} A promise that resolves once the chat history is displayed.
   */
  async _showUserChatHistory(message) {
    const chatHistory = this._openAi.getUserHistory(message.author.username);

    // Check if there's no chat history available
    if (!chatHistory.length) {
      return await this._sendToChannel(this.defaultChannel, "There are no chats to view!");
    }

    const loadingMessage = await this._sendToChannel(
      this.defaultChannel,
      `Fetching chat history from ${message.author.username}'s account...`
    );

    const popupEmbed = await this._createEmbeddedChatHistory(chatHistory, message);
    await loadingMessage.edit({ content: "Here is your chat history:", embeds: [popupEmbed] });
  }

  /**
   * Creates an embedded representation of the provided chat history.
   * @param {string[][]} chatHistory The chat history to be embedded.
   * @param {Message} message The message object used for context, such as the author's username.
   * @returns {Promise<MessageEmbed>} A promise that resolves with the embedded chat history.
   */
  async _createEmbeddedChatHistory(chatHistory, message) {
    // Extract question-answer pairs from the chat history
    const fields = this._generateFieldsFromQAPairs(chatHistory);

    // Create the embedded message
    const popupEmbed = new EmbedBuilder()
      .setTitle("User Chat History")
      .setAuthor({ name: `Bot name: ${this._openAi.name}` })
      .setColor("DarkRed")
      .setTimestamp(currentTimeNow)
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
        value: `A:  ${answer}`,
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

  get defaultChannel() {
    return this.guild && this.guild.id === this._serverID ? this.guild?.systemChannel : null;
  }

  get guild() {
    return this._client.guilds.cache.get(this._serverID);
  }
}

module.exports = BotManager;
