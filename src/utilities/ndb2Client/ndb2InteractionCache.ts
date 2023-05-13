import {
  ButtonInteraction,
  CacheType,
  ChatInputCommandInteraction,
} from "discord.js";

type NDB2InteractionCache = {
  retirements: { [key: string]: ChatInputCommandInteraction<CacheType> };
  triggers: { [key: string]: ChatInputCommandInteraction<CacheType> };
  triggerNotices: { [key: string]: ButtonInteraction<CacheType> };
};

const cache: NDB2InteractionCache = {
  retirements: {},
  triggers: {},
  triggerNotices: {},
};

export default cache;
