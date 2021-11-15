import { Client, ClientOptions, Intents } from "discord.js";

/***********************************
 *  Bot Config
 ************************************/

const simpleIntents = new Intents();
const utilityIntents = new Intents();

simpleIntents.add(
  Intents.FLAGS.GUILDS,
  Intents.FLAGS.GUILD_MESSAGES,
  Intents.FLAGS.DIRECT_MESSAGES
);

utilityIntents.add(
  Intents.FLAGS.GUILD_MESSAGES,
  Intents.FLAGS.GUILDS,
  Intents.FLAGS.GUILD_MEMBERS,
  Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
  Intents.FLAGS.DIRECT_MESSAGES
);

const simpleOptions: ClientOptions = {
  intents: simpleIntents,
};
const utilityOptions: ClientOptions = {
  partials: ["MESSAGE", "CHANNEL", "REACTION", "GUILD_MEMBER"],
  intents: utilityIntents,
};

/***********************************
 *  Bot Initialization
 ************************************/

const utilityBot = new Client(utilityOptions);
const bcBot = new Client(simpleOptions);
const wmBot = new Client(simpleOptions);
const ofnBot = new Client(simpleOptions);
const mecoBot = new Client(simpleOptions);
const rprBot = new Client(simpleOptions);
const hlBot = new Client(simpleOptions);

export { utilityBot, bcBot, wmBot, ofnBot, mecoBot, rprBot, hlBot };
