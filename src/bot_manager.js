const {
  Client,
  GatewayIntentBits,
  Events,
  TextChannel,
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
  }

  /**
   * Logs the bot in.
   * Sends a greeting message to the system channel of the server when the bot connects to Discord for the first time.
   */
  login() {
    if (!this._initialized) {
      this._client.once(Events.ClientReady, (readyClient) => {
        const guild = this._client.guilds.cache.get(this._serverID);
        if (!guild) return console.error("Server (guild) not found.");

        this._initialized = true;
        const defaultChannel = guild.systemChannel;
        const msg = `Hello everyone! I'm the ${readyClient.user.displayName}, now online and ready to chat.`;
        this._sendToChannel(defaultChannel, msg);
      });
    }
    this._client.login(this._discordBotToken);
  }

  /**
   * Listens for the 'guildMemberAdd' event, triggered when a new member joins the server,
   * and sends a welcome message to the system channel announcing the new member.
   */
  announceNewMember() {
    this._handleGuildEventHelperFunction(Events.GuildMemberAdd, (member) => {
      return `Welcome to the server, ${member}!`;
    });
  }

  /**
   * Listens for the 'guildMemberRemove' event, triggered when a member leaves the server,
   * and sends a message to the system channel announcing the member's departure.
   */
  announceMemberLeave() {
    this._handleGuildEventHelperFunction(Events.GuildMemberRemove, (member) => {
      return `${member.user.tag} has left the server`;
    });
  }

  /**
   * This helper function is called internally by methods responsible for handling specific member related guild events.
   * @param { Events } guildMemberString - The name of the guild event to handle (e.g., 'guildMemberAdd', 'guildMemberRemove').
   * @param {Function} msgBuilder - A function that dynamically constructs the message for the event.
   * @private
   */
  _handleGuildEventHelperFunction(guildMemberString, msgBuilder) {
    this._client.on(guildMemberString, (member) => {
      const channel = member.guild.systemChannel;
      const msg = msgBuilder(member);
      this._sendToChannel(channel, msg);
    });
  }

  /**
   * Sends a message to the specified Discord server channel.
   * @param {TextChannel} channel - The Discord server channel to send the message to.
   * @param {string} message - The message content to send.
   * @private
   */
  _sendToChannel(channel, message) {
    if (!channel) return console.error("Default channel not found!!");
    channel.send(message);
  }
}

module.exports = BotManager;
