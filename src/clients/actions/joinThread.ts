import { ThreadChannel } from "discord.js";

export default async function joinThread(thread: ThreadChannel) {
  if (!thread.joinable) {
    return;
  }
  try {
    await thread.join();
  } catch (err) {
    console.error(err);
  }
}
