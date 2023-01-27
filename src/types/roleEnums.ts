export enum SpecificRole {
  MODS = "mods",
  BOTS = "bots",
  HOSTS = "hosts",
  GUESTS = "guests",
  WEMARTIANS = "wemartians",
  MECO = "meco",
  YOUTUBE = "youtube",
  YT_ANOMALY = "youtube_anomaly",
  PREMIUM = "premium",
  ANOMALY = "anomaly",
  NFRS = "nfrs",
}

export const roleIds = {
  [SpecificRole.MODS]: process.env.MODS_ROLE_ID,
  [SpecificRole.BOTS]: process.env.BOT_ROLE_ID,
  [SpecificRole.HOSTS]: process.env.HOST_ROLE_ID,
  [SpecificRole.GUESTS]: process.env.GUEST_ROLE_ID,
  [SpecificRole.WEMARTIANS]: process.env.WM_ROLE_ID,
  [SpecificRole.MECO]: process.env.MECO_ROLE_ID,
  [SpecificRole.YOUTUBE]: process.env.YOUTUBE_ROLE_ID,
  [SpecificRole.YT_ANOMALY]: process.env.YT_ANOMALY_ROLE_ID,
  [SpecificRole.PREMIUM]: process.env.PREMIUM_ROLE_ID,
  [SpecificRole.ANOMALY]: process.env.ANOMALY_ROLE_ID,
  [SpecificRole.NFRS]: process.env.NFRS_ROLE_ID,
};
