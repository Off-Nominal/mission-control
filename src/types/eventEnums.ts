export enum NewsManagerEvents {
  NEW = "newNews",
  READY = "ready",
  ERROR = "error",
}

export enum MemberManagerEvents {
  SEND_DELINQUENTS = "sendDelinquents",
}

export enum ContentListnerEvents {
  NEW = "newContent",
  STREAM_START = "streamStarted",
  STREAM_END = "streamEnded",
  READY = "ready",
  ERROR = "error",
}

export enum DevEvents {
  NEW_ENTRIES = "dev_new entries",
  DB_TEST = "dev_dbtest",
  THREAD_DIGEST_SEND = "dev_threadDigestSend",
}

export enum RLLEvents {
  READY = "ready",
  BOOT_ERROR = "boot_error",
  ERROR = "error",
}
