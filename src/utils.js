/**
 * Parses a 'user mention' and message from a message object and extracts the user ID and message content.
 * 
 * @param {object} messageObj - The message object containing the message content.
 * @returns {object} An object containing the user ID and message content.
*/
function parseUserMentionAndMessage(messageObj) {
    const regex = /<@(\d+)> (.+)/;

    const match          = messageObj.match(regex);
    const userId         = match ? match[1] : null;
    const messageContent = match ? match[2] : null;

    return { userId, messageContent};
}


module.exports = parseUserMentionAndMessage;