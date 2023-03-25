import { CacheType, ChatInputCommandInteraction } from "discord.js";

type NDB2InteractionCache = {
  retirements: { [key: string]: ChatInputCommandInteraction<CacheType> };
  triggers: { [key: string]: ChatInputCommandInteraction<CacheType> };
};

const cache: NDB2InteractionCache = {
  retirements: {},
  triggers: {},
};

export default cache;
