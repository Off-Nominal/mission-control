import { Client, Partials } from "discord.js";
import mcconfig from "../mcconfig";

const helperBot = new Client({
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
    Partials.GuildMember,
  ],
  intents: [
    mcconfig.discord.intents.simpleIntents,
    mcconfig.discord.intents.utilityIntents,
  ],
});

helperBot.login(mcconfig.discord.clients.helper.token);

export default helperBot;
