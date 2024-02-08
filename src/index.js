const { Client,  GatewayIntentBits } = require('discord.js');


const openAi            = require("openai");
const dotenv            = require("dotenv").config();

const DISCORD_BOT_TOKEN = dotenv.parsed.DISCORD_BOT_TOKEN;
const OPEN_AI_KEY       = dotenv.parsed.OPEN_AI_KEY;
const SERVER_ID         = dotenv.parsed.SERVER_ID;



/**
 * Represents a manager for a Discord bot, responsible for initializing the bot,
 * handling events such as new member announcements, and sending messages to Discord channels.
 */
class BotManager {

    /**
     * Constructs a new BotManager instance with the specified Discord bot token and server ID.
     * @param {string} DISCORD_BOT_TOKEN - The Discord bot token used for authentication.
     * @param {string} SERVER_ID - The ID of the server where the bot will operate.
     */
    constructor(DISCORD_BOT_TOKEN, SERVER_ID) {
        // Initialize the Discord client with necessary intents
        this._client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers,
            ],
        });

        this._discordBotToken = DISCORD_BOT_TOKEN;
        this._serverID        = SERVER_ID;
        this._initialized     = false;
    }

    /**
     * Sets the Discord bot token.
     * @param {string} discordToken - The new Discord bot token to set.
     */
    setToken(discordToken) {
        this._discordBotToken = discordToken;
    }

    /**
     * Gets the current Discord bot token.
     * @returns {string} The Discord bot token.
     */
    getToken() {
        return this._discordBotToken;
    }

    /**
     * Initializes the bot (once) so that when the bot connects to Discord for the first time,
     * it sends a greeting message to the system channel of the server, announcing the bot's presence.
     */
    init() {
        if (!this._initialized) {
            this._client.once('ready', readyClient => {

                const guild = this._client.guilds.cache.get(this._serverID);
                if (!guild) return console.error("Server (guild) not found.");

                this._initialized    = true;
                const defaultChannel = guild.systemChannel;
                const msg            = `Hello everyone! I'm the ${readyClient.user.displayName}, now online and ready to serve.`;
              

                // Comment this out on your local computer (at least in development) because each time you change a line in the code or make
                // changes the server restarts due to the change which means the bot announces itself again to the server
                this._sendToChannel(defaultChannel, msg);
                
            });
        }
    }

    /**
     * Listens for the 'guildMemberAdd' event, triggered when a new member joins the server,
     * and sends a welcome message to the system channel announcing the new member.
     */
    announceNewMember() {
        const guildMemberEvent = "guildMemberAdd"; // Add member event

        this._handleGuildEventHelperFunction(guildMemberEvent, (member) => {
            return `Welcome to the server, ${member}!`;
        });
    }

    /**
     * Listens for the 'guildMemberRemove' event, triggered when a member leaves the server,
     * and sends a message to the system channel announcing the member's departure.
     */
    announceMemberLeave() {
        const guildMemberEvent = "guildMemberRemove"; // Remove member event

        this._handleGuildEventHelperFunction(guildMemberEvent, (member) => {
            return `${member.user.tag} has left the server`;
        });
    }

   /**
     * This helper function is called internally by methods responsible for handling specific guild events.
     * The method does all the heavy lifting by abstracting how the event is handled and providing an easier-to-use interface.
     * @param {string} guildMemberString - The name of the guild event to handle (e.g., 'guildMemberAdd', 'guildMemberRemove').
     * @param {Function} msgBuilder - A function that dynamically constructs the message for the event.
     * @private
     */
    _handleGuildEventHelperFunction(guildMemberString, msgBuilder) {
        this._client.on(guildMemberString, member => {

            const channel = member.guild.systemChannel;
            const msg     = msgBuilder(member);
            this._sendToChannel(channel, msg);
        });
    }

    /**
     * Sends a message to the specified Discord server channel.
     * @param {TextChannel} channel - The Discord server channel to send the message to.
     * @param {string} message - The message content to send.
     */
    _sendToChannel(channel, message) {
        if (!channel) return console.error("Default channel not found!!");
        channel.send(message);
    }

    /**
     * Logs in the bot using the specified Discord bot token.
     */
    login() {
        this._client.login(this._discordBotToken);
    }
}


const botManager = new BotManager(DISCORD_BOT_TOKEN, SERVER_ID);
botManager.init();
botManager.login();
botManager.announceNewMember();
botManager.announceMemberLeave();
