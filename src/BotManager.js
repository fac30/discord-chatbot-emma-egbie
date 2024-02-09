const {
  Client,
  GatewayIntentBits,
  Events,
  TextChannel,
  Message,
  GuildMember,
} = require("discord.js");

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
  constructor(discordBotToken, server_ID) {
    /** @private */
    this._client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
      ],
    });
    /** @private */
    this._discordBotToken = discordBotToken;
    /** @private */
    this._serverID = server_ID;
    /** @private */
    this._initialized = false;

    // hook up event listeners here
    this._client.on(Events.MessageCreate, this._onMessageCreate.bind(this));
    this._client.on(Events.GuildMemberAdd, this._announceNewMember.bind(this));
    this._client.on(Events.GuildBanRemove, this._announceMemberLeave.bind(this));
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
   * @param { Message } message
   * @private
   */
  _onMessageCreate(message) {
    const author = message.author.id;
    if (author !== this._client.application.id) {
      this._sendToChannel(message.channel, "hello");
    }
  }

  /**
   * Sends a welcome message to the system channel announcing the new member.
   * @param { GuildMember } member
   * @private
   */
  _announceNewMember(member) {
    const message = `Welcome to the server, ${member.user.tag}!`;
    this._sendToChannel(member.channel, message);
  }

  /**
   * Sends a message to the system channel announcing the member's departure.
   * @param { GuildMember } member
   * @private
   */
  _announceMemberLeave(member) {
    const message = `${member.user.tag} has left the server`;
    this._sendToChannel(member.channel, message);
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
    return guild?.systemChannel;
  }
}

module.exports = BotManager;
