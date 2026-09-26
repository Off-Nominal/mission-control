import { Client } from "pg";

const UPSERT_CHUNK_SIZE = 1000;

export class MemberClubVerification {
  private db: Client;

  constructor(db: Client) {
    this.db = db;
  }

  public upsertLastVerifiedAt = async (
    discordUserIds: string[],
    verifiedAt: Date
  ): Promise<number> => {
    if (discordUserIds.length === 0) {
      return 0;
    }

    let submitted = 0;

    for (let i = 0; i < discordUserIds.length; i += UPSERT_CHUNK_SIZE) {
      const chunk = discordUserIds.slice(i, i + UPSERT_CHUNK_SIZE);
      await this.db.query(
        `INSERT INTO member_club_verification (discord_user_id, last_verified_at)
         SELECT discord_user_id, $2::timestamptz
         FROM unnest($1::text[]) AS discord_user_id
         ON CONFLICT (discord_user_id)
         DO UPDATE SET last_verified_at = EXCLUDED.last_verified_at
         WHERE member_club_verification.last_verified_at < EXCLUDED.last_verified_at`,
        [chunk, verifiedAt]
      );
      submitted += chunk.length;
    }

    return submitted;
  };
}
