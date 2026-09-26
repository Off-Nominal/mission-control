import { Client } from "pg";

export type MemberClubVerificationRow = {
  discord_user_id: string;
  last_verified_at: Date;
};

export class MemberClubVerification {
  private db: Client;

  constructor(db: Client) {
    this.db = db;
  }

  public getLastVerifiedAt = async (
    discordUserId: string
  ): Promise<Date | null> => {
    const result = await this.db.query<MemberClubVerificationRow>(
      "SELECT last_verified_at FROM member_club_verification WHERE discord_user_id = $1",
      [discordUserId]
    );

    const row = result.rows[0];
    if (!row) {
      return null;
    }

    return row.last_verified_at;
  };

  public upsertLastVerifiedAt = async (
    discordUserId: string,
    verifiedAt: Date
  ): Promise<void> => {
    await this.db.query(
      `INSERT INTO member_club_verification (discord_user_id, last_verified_at)
       VALUES ($1, $2)
       ON CONFLICT (discord_user_id)
       DO UPDATE SET last_verified_at = EXCLUDED.last_verified_at`,
      [discordUserId, verifiedAt]
    );
  };
}
