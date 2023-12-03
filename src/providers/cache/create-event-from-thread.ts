import { Message } from "discord.js";

type CreateForumFromThreadCache = {
  messages: { [key: string]: Message };
};

const cache: CreateForumFromThreadCache = {
  messages: {},
};

export default cache;
