import { Guild } from "discord.js";

export async function collectClubMemberIds(
  guild: Guild,
  clubRoleIds: string[]
): Promise<Set<string>> {
  const memberIds = new Set<string>();

  for (const roleId of clubRoleIds) {
    try {
      const role = await guild.roles.fetch(roleId);
      if (!role) {
        continue;
      }

      for (const memberId of role.members.keys()) {
        memberIds.add(memberId);
      }
    } catch (err) {
      console.error(`Failed to fetch club role ${roleId}`, err);
      throw err;
    }
  }

  return memberIds;
}
