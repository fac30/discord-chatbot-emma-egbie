# Discord Chatbot ✨

A FAC [discord ai chatbot](https://learn.foundersandcoders.com/course/syllabus/foundation/node/project/)
Made by Emma & Egbie

## Prerequisites

in order to get this bot working, we need access to the following things

- [Server ID of a guild](#guild-server-id) where you can add members to.
- [Token of a discord bot](#discord-bot-token) which you can create & manage the permissions of.
- An [Open AI Key](#open-ai-key) linked to an account with some form of credit.

- If you're setting this up for the first time, you'll also need your bot's Client ID and an appropriate bot Permission Integer.

If you have all the above, please skip to the
[Installation Steps](#installation-steps) instead.

### Guild Server ID

1. Enable developer mode (discord desktop) by pressing the _cog_ next to your pofile icon to enter settings, selecting _Advanced_, and toggling on _Developer Mode_.
2. After exiting settings, right click on the guild to which you want to add the bot and select _Copy Server ID_. Make a note of that somewhere.

Note: If you want to add the bot to someone else's guild, make sure to have their permissions first. If you don't have the required permissions, you'll also need to ask them to add the bot to the guild for you.

### Discord Bot Token

Assuming you're generating a discord app for the first time:

1. Login to the [discord developer portal](https://discord.com/developers/applications).
2. Create a _New Application_.
3. Select your bot & click on _Bot_ on the LHS menu.
4. **Click on _Reset Token_ and make a note of it for later**. If you lose this token, you'll need to generate a new one.
5. Generate a Permission Integer by using the tool at the bottom of the Bot menu. Keep in mind that for the bot to function as intended, it needs to be able to moderate users on top of other permissions like sending & receiving messages. We recommend using the following permissions integer: `1995012435014`
6. Navigating to the _OAuth2 menu_ on the left, make a note of the _Client ID_
7. Construct a URL of the following format: `https://discord.com/oauth2/authorize?client_id=CLIENT_ID&scope=bot&permissions=PERMISSIONS_INTEGER`, replacing `CLIENT_ID` and `PERMISSIONS_INTEGER` with the values found above.
8. By following the link, add the bot to the server with the same [Guild Server ID](#guild-server-id). Note: if you're not an admin on the server, send this link to someone who is.

### Open AI Key

This is assuming this is your first time dealing with OpenAI's API:

1. After creating an OpenAI account, navigate to the [API keys](https://platform.openai.com/api-keys) menu.
2. Create a new _Secret Key_ and make a note of it.
3. Make sure you have some credit available.

## Installation Steps

1. `git clone` the repository & navigate into it
2. run `npm install` to install all packages required
3. create a `.env` file and copy the contents into it from `.env-template`
4. Inside the `.env` file, fill in the values of the _Server ID_, _Discord Bot Token_, and _OpenAI API key_ with the values you've acquired from following the Prerequisite steps.
5. start the project using `npm start`

## Using Your Bot 🤖 💬

If all went well and you've added your bot successfully to a guild, you should be able to interact with it by mentioning, followed by a prompt, like so:

> **@BOT_NAME** Hey, can you tell me a fun fact

You can also see your chat history by typing:

> **@BOT_NAME** !showMyChatHistory

_The bot will also delete & notify you of any messages which are flagged by the OpenAI's moderation API, and will issue timeouts (up to an hour) for repeat offenders._

## Dev Info

This project uses `ESLint` and `Prettier` to try and maintain some form of formatting consistency. It's helping us write cleaner and more readable code collaboratively.
