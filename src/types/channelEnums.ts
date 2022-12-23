export enum SpecificChannel {
  MODS = "mods",
  BOTS = "bots",
  WELCOME = "welcome",
  ANNOUNCEMENTS = "announcements",
  CONTENT = "content",
  SUPPORT = "support",
  NEWS = "news",
  GENERAL = "general",
  SCIENCE = "science",
  SPACESHIPS = "spaceships",
  LAUNCH = "launch",
  SATELLITE = "satellite",
  POLICY = "policy",
  HISTORY = "history",
  MEDIA = "media",
  TECH = "tech",
  RANDOM = "random",
  PATREON_MECO = "patreon_meco",
  PATREON_WEMARTIANS = "patreon_wemartians",
  MEMBERS_OFFNOMINAL = "members_offnominal",
  LIVECHAT = "livechat",
  BOCA_CHICA = "boca_chica",
  BOOKCLUB = "bookclub",
  LIVE = "live",
  HANGOUT = "hangout",
  OLD_COVID19 = "old_covid19",
}

export const channelIds = {
  [SpecificChannel.LIVECHAT]: process.env.LIVECHATCHANNELID,
  [SpecificChannel.BOCA_CHICA]: process.env.BOCACHICACHANNELID,
  [SpecificChannel.CONTENT]: process.env.CONTENTCHANNELID,
  [SpecificChannel.ANNOUNCEMENTS]: process.env.ANNOUNCEMENTSCHANNELID,
  [SpecificChannel.GENERAL]: process.env.GENERALCHANNELID,
  [SpecificChannel.MODS]: process.env.MODSCHANNELID,
  [SpecificChannel.NEWS]: process.env.NEWS_CHANNEL_ID,
  [SpecificChannel.BOTS]: process.env.BOTS_CHANNEL_ID,
};
