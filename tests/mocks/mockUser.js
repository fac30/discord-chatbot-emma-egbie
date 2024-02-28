/**
 * Represents a mock user for testing purposes.
 */
class MockUser {
    /**
     * Creates a new MockUser instance.
     * @param {string} id - The unique identifier of the user.
     * @param {string} username - The username of the user.
     * @param {string} globalName - The global name of the user.
     */
    constructor(id, username, globalName) {
        this.id         = id;
        this.username   = username;
        this.globalName = globalName;
        this.user       = this.getUser();
    }
  
    /**
     * Generates a mock user object with a mock message.
     * @returns {object} A mock user object with a mock message.
     */
    getUser() {
        const dateNow = new Date();
        return {
            id: this.id,
            bot: false,
            system: false,
            username: this.username,
            globalName: this.globalName,
            message: {
                channelId: "mock channel id",
                guildId: null,
                id: "Mock id",
                createdTimestamp: dateNow.getTime(),
                type: 0,
                system: false,
                content: "This is a mock message",
                author: {
                    id: "mock author id",
                    bot: true,
                    system: false,
                }
            },
            author: {
                id: this.id,
                username: this.username,

            },
            
            send: (message) =>{
                
            }
        };
    }
}

module.exports = MockUser;
