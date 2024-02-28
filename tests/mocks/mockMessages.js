
/**
 * Represents a collection of mock message objects for testing purposes.
 */
class MockMessages {
    /**
     * Constructs a new instance of the MockMessages class.
     * Initializes the date property.
     */
    constructor() {
        this._date = new Date();
    }

    /**
     * Provides a mock message object representing a message that has been sent.
     * @returns {object} A mock message object.
     */
    get sentMessage() {
        return {
            channelId: '1210569481391448066',
            guildId: '1210569480749457428',
            id: '1210613247498002442',
            createdTimestamp: this._date.getTime(),
            type: 0,
            system: false,
            content: '<@733473713210785812> what are you?',
            author: {
                id: 'mock author id',
                bot: false,
                username: "",
            }
        };
    }

    /**
     * Provides a mock message object representing a message that has been received.
     * @returns {object} A mock message object.
     */
    get receivedMessage() {
        return {

            channelId: 'mock channel id',
            guildId: 'mock guild id',
            id: 'mock id',
            createdTimestamp: this._date.getTime(),
            type: 0,
            system: false,
            content: '<@733473713210785812> Hello',
            application: {
                id: "mock application id",
            },
            author: {
                id: 'mock author id',
                bot: true,
            },
            mentions: {
                has: (userID) => {
                    return userID === "<@733473713210785812>"; 
                }
            }
        };
    }
}

module.exports = MockMessages;
