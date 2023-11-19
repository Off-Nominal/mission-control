import { ThreadChannel } from "discord.js";
import { Providers } from "../../providers";

export async function joinThread(thread: ThreadChannel) {
  if (!thread.joinable) {
    return;
  }
  try {
    await thread.join();
  } catch (err) {
    console.error(err);
  }
}

export default function JoinDiscordThread({
  contentBot,
  eventsBot,
  helperBot,
  ndb2Bot,
}: Providers) {
  contentBot.on("threadCreate", joinThread);
  eventsBot.on("threadCreate", joinThread);
  helperBot.on("threadCreate", joinThread);
  ndb2Bot.on("threadCreate", joinThread);
}
