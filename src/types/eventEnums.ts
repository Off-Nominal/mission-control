export enum NewsManagerEvents {
  NEW = "newNews",
  READY = "ready",
  ERROR = "error",
}

export enum MemberManagerEvents {
  SEND_DELINQUENTS = "sendDelinquents",
}

export enum ContentBotEvents {
  RSS_LIST = "rssList",
}

export enum EventBotEvents {
  START = "eventStarted",
  END = "eventEnded",
  RETRIEVED = "eventsRetrieved",
  NEW_TITLE = "newStreamTitle",
  VIEW_TITLES = "viewStreamTitles",
}

export enum EventListenerEvents {
  MONITOR = "eventsMonitored",
  READY = "ready",
}

export enum ContentListnerEvents {
  NEW = "newContent",
  STREAM_START = "streamStarted",
  STREAM_END = "streamEnded",
  READY = "ready",
  ERROR = "error",
}

export enum UtilityBotEvents {
  SUMMARY_CREATE = "summaryReportCreate",
  SUMMARY_SEND = "summaryReportSend",
  THREAD_DIGEST_SEND = "threadDigestSend",
  STARSHIP_UPDATE = "starshipSiteUpdate",
  SEND_DELINQUENTS = "sendDelinquents",
}

export enum SiteListenerEvents {
  UPDATE = "siteUpdate",
  READY = "ready",
}

export enum StreamHostEvents {
  PARTY_MESSAGE = "partyMessage",
}

export enum DevEvents {
  NEW_ENTRIES = "dev_new entries",
  DB_TEST = "dev_dbtest",
  THREAD_DIGEST_SEND = "dev_threadDigestSend",
}

export enum RLLEvents {
  READY = "ready",
  ERROR = "error",
}
