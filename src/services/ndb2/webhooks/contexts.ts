import { AsyncLocalStorage } from "async_hooks";
import { Logger, LogInitiator } from "../../../logger/Logger";
import { Guild } from "discord.js";

export const loggerContext = new AsyncLocalStorage<Logger>();
export const getLoggerFromContext = (): Logger => {
  const logger = loggerContext.getStore();

  if (!logger) {
    return new Logger(
      "Fallback Logger",
      LogInitiator.SERVER,
      "Get Logger From Store"
    );
  }

  return logger;
};

export const guildContext = new AsyncLocalStorage<Guild>();
export const getGuildFromContext = (): Guild => {
  const guild = guildContext.getStore();
  if (!guild) {
    throw new Error("Guild not found in context");
  }

  return guild;
};
