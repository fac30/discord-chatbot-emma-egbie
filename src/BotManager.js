const {
  Client,
  GatewayIntentBits,
  Events,
  TextChannel,
  Message,
  GuildMember,
} = require("discord.js");

const OpenAiManager = require("./OpenAiManager");
const parseUserMentionAndMessage = require("./utils.js");

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
    const msg = `Hello everyone! I'm the ${this._client.user.displayName}, now online and ready to chat.`;
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
  _onMessageCreate(message) {
    const author = message.author.id;
    const content = message.content;
    const hasBeenMentioned = message.mentions.has(this._client.user.id);
    const isSameAuthor = author === this._client.application.id;
    const currentTimeNow = Date.now();
    const waitTimeLimit = 3000; // assigned name to avoid the dreaded "magic number" know in programming
    const hasTalkedRecently =
      this._lastMessageTime && currentTimeNow - this._lastMessageTime < waitTimeLimit;

    if (author !== this._client.application.id) {
      const { userId, messageContent } = parseUserMentionAndMessage(content);
      if (userId && messageContent) {
        this._sendDirectMessageToUser(userId, messageContent);
      }
    }

    //  We don't send a message if:
    // - we sent the last message
    // - we haven't been mentioned in the last message
    // - we already replied in the last 3 seconds
    if (isSameAuthor || hasTalkedRecently || !hasBeenMentioned) {
      return;
    }

    this._queryOpenAi(content, message, currentTimeNow);
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
   * @param {number} currentTimeStamp - The current timestamp used for tracking the time of the last message.
   */
  _queryOpenAi(prompt, message, currentTimeStamp) {
    this._openAi.prompt(prompt, message.author.username).then((reply) => {
      if (reply && reply.length) {
        this._sendToChannel(message.channel, `<@${message.author.id}> ${reply}`);
        this._lastMessageTime = currentTimeStamp;
      }
    });
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
  _sendToChannel(channel, message) {
    if (!channel) return console.error("Channel not found!!");

    channel.send(message);
  }

  get defaultChannel() {
    const guild = this._client.guilds.cache.get(this._serverID);
    return guild && guild.id === this._serverID ? guild?.systemChannel : null;
  }
}

module.exports = BotManager;
