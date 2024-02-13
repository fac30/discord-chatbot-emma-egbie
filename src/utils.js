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


/**
 * Extracts all question-answer pairs from a chat history string.
 * @param {string} chatHistory - The chat history string containing question-answer pairs.
 * @returns {string[]} An array of question-answer pairs extracted from the chat history.
 */
function extractQuestionAnswerPairs(chatHistory) {
    return chatHistory.split(/(?=Q:)/).filter(pair => pair.trim() !== "");
}



function changeStringToTitle(string) {
    return string[0].toUpperCase() + string.slice(1);
}



// Exporting multiple variables or functions
module.exports = {
    changeStringToTitle,
    extractQuestionAnswerPairs,
    parseUserMentionAndMessage,
};
