import { PermissionResolvable, ThreadChannel } from "discord.js";
import fetchGuild from "../../actions/fetchGuild";
import joinThread from "../../actions/joinThread";

const MODS_ROLE_ID = process.env.MODS_ROLE_ID as PermissionResolvable;

export default async function handleThreadCreate(thread: ThreadChannel) {
  await joinThread(thread);

  const guild = fetchGuild(thread.client);

  // Auto-adds moderators to all threads
  const mods = guild.members.cache.filter((member) =>
    member.roles.cache.some((role) => role.id === MODS_ROLE_ID)
  );

  console.log(`Found ${mods.size} mods.`);
  console.log("Adding mods to Thread");

  mods.forEach((mod) => {
    thread.members
      .add(mod.id)
      .then(() => console.log(`Added ${mod.displayName}`))
      .catch((err) => {
        console.error(`Failed to add ${mod.displayName} to Thread`);
        console.error(err);
      });
  });
}
