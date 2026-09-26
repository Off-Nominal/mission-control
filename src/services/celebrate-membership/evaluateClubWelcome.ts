import { sub } from "date-fns";

export function shouldWelcomeClubMember(
  lastVerifiedAt: Date | null,
  now: Date,
  cooldownDays: number
): boolean {
  if (!lastVerifiedAt) {
    return true;
  }

  const cutoff = sub(now, { days: cooldownDays });
  return lastVerifiedAt < cutoff;
}
