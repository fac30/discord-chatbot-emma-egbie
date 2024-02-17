/**
 * Parses a 'user mention' and message from a message object and extracts the user ID and message content.
 *
 * @param {object} messageObj - The message object containing the message content.
 * @returns {object} An object containing the user ID and message content.
 */
function parseUserMentionAndMessage(messageObj) {
  const regex = /<@&?(\d+)> ?(.*)/;
  const match = messageObj.match(regex);

  // Extract userId and messageContent from the match, if any
  const userId = match ? match[1] : null;
  const messageContentAfterMention = match ? match[2].trim() : null;

  return { userId, messageContent: messageContentAfterMention };
}

function changeStringToTitle(string) {
  return string[0].toUpperCase() + string.slice(1);
}

// Exporting multiple variables or functions
module.exports = {
  changeStringToTitle,
  parseUserMentionAndMessage,
};
