import { ThreadChannel } from "discord.js";
import joinThread from "../../actions/joinThread";

export default async function handleThreadCreate(thread: ThreadChannel) {
  await joinThread(thread);
}
