import { Client, TextChannel } from "discord.js";

export default async function fetchTextChannel(client: Client, id: string) {
  return (await client.channels.fetch(id)) as TextChannel;
}
