import { ActivityType, Client, PresenceData } from "discord.js";
import { Providers } from "../../providers";

function generatePresenceData(helpCommand: string): PresenceData {
  return {
    status: "online",
    activities: [
      {
        name: helpCommand,
        type: ActivityType.Playing,
      },
    ],
  };
}

function setPresence(client: Client, message: string) {
  client.user.setPresence(generatePresenceData(message));
}

export default function SetDiscordClientPresence({
  contentBot,
  eventsBot,
  helperBot,
  ndb2Bot,
}: Providers) {
  contentBot.once("ready", (client) => setPresence(client, "/content help"));
  eventsBot.once("ready", (client) => setPresence(client, "/events help"));
  helperBot.once("ready", (client) => setPresence(client, "/help"));
  ndb2Bot.once("ready", (client) => setPresence(client, "/ndb help"));
}
