import { GuildScheduledEvent } from "discord.js";
import { Client } from "pg";

export default function generateGuildScheduledEventCreate(db: Client) {
  return async function handleGuildScheduledEventCreate(
    event: GuildScheduledEvent
  ) {
    //
  };
}
