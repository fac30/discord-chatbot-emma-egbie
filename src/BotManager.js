const {
  Client,
  GatewayIntentBits,
  Events,
  TextChannel,
  Message,
  GuildMember,
} = require("discord.js");
const OpenAiManager = require("./OpenAiManager");

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
   * @param { Message } message
   * @private
   */
  _onMessageCreate(message) {
    const author = message.author.id;
    const content = message.content;
    const now = Date.now();

    const isSameAuthor = author === this._client.application.id;
    const hasTalkedRecently = this._lastMessageTime && now - this._lastMessageTime < 3000;
    if (isSameAuthor || hasTalkedRecently) {
      return;
    }

    this._openAi.prompt(content, message.author.username).then((reply) => {
      if (reply.length) {
        this._sendToChannel(message.channel, reply);
        this._lastMessageTime = now;
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
