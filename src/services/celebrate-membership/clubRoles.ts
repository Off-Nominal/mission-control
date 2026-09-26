import type mcconfigType from "../../mcconfig";

type McConfig = typeof mcconfigType;

export function getClubRoleIds(mcconfig: McConfig): string[] {
  const roles = mcconfig.discord.roles;
  return [
    roles.premium,
    roles.youtube,
    roles.wemartians,
    roles.meco,
    roles.anomaly,
    roles.nfrs,
    roles.youtube_anomaly,
  ].filter((id): id is string => Boolean(id));
}

export function memberHasClubRole(
  roleIds: Iterable<string>,
  clubRoleIds: ReadonlySet<string>
): boolean {
  for (const roleId of roleIds) {
    if (clubRoleIds.has(roleId)) {
      return true;
    }
  }
  return false;
}
