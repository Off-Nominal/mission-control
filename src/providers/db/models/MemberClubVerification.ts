import { Client } from "pg";

export type ClubWelcomeClaim = {
  claimed: boolean;
  previousVerifiedAt: Date | null;
};

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

  public claimWelcome = async (
    discordUserId: string,
    verifiedAt: Date,
    staleBefore: Date
  ): Promise<ClubWelcomeClaim> => {
    const result = await this.db.query<{
      previous_verified_at: Date | null;
      claimed: boolean;
    }>(
      `WITH previous AS (
         SELECT last_verified_at
         FROM member_club_verification
         WHERE discord_user_id = $1
       ),
       upserted AS (
         INSERT INTO member_club_verification (discord_user_id, last_verified_at)
         VALUES ($1, $2)
         ON CONFLICT (discord_user_id)
         DO UPDATE SET last_verified_at = EXCLUDED.last_verified_at
         WHERE member_club_verification.last_verified_at < $3::timestamptz
         RETURNING discord_user_id
       )
       SELECT
         (SELECT last_verified_at FROM previous) AS previous_verified_at,
         EXISTS (SELECT 1 FROM upserted) AS claimed`,
      [discordUserId, verifiedAt, staleBefore]
    );

    const row = result.rows[0];
    return {
      claimed: row?.claimed === true,
      previousVerifiedAt: row?.previous_verified_at ?? null,
    };
  };

  public releaseWelcomeClaim = async (
    discordUserId: string,
    claimedAt: Date,
    previousVerifiedAt: Date | null
  ): Promise<void> => {
    if (!previousVerifiedAt) {
      await this.db.query(
        `DELETE FROM member_club_verification
         WHERE discord_user_id = $1 AND last_verified_at = $2`,
        [discordUserId, claimedAt]
      );
      return;
    }

    await this.db.query(
      `UPDATE member_club_verification
       SET last_verified_at = $3
       WHERE discord_user_id = $1 AND last_verified_at = $2`,
      [discordUserId, claimedAt, previousVerifiedAt]
    );
  };
}
