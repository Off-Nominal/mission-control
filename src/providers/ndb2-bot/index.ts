import { Client } from "discord.js";
import mcconfig from "../../mcconfig";
import bootLogger from "../../logger";
import { LogStatus } from "../../logger/Logger";

export enum Ndb2Events {
  NEW_PREDICTION = "new_prediction",
  NEW_BET = "new_bet",
  VIEW_PREDICTION = "view_prediction",
  VIEW_DETAILS = "view_details",
  RETIRE_PREDICTION = "retire_prediction",
  TRIGGER_PREDICTION = "trigger_prediction",
  NEW_VOTE = "new_vote",
  VIEW_SCORE = "view_score",
  LIST_PREDICTIONS = "list_predictions",
  SEARCH_PREDICTIONS = "search_predictions",
  VIEW_LEADERBOARDS = "view_leaderboards",
}

const ndb2Bot = new Client({
  intents: [mcconfig.discord.intents.simpleIntents],
});

// Handlers
ndb2Bot.on("error", console.error);
ndb2Bot.once("ready", () => {
  bootLogger.addLog(LogStatus.SUCCESS, "NDB2 Bot ready");
  bootLogger.logItemSuccess("ndb2Bot");
});

// Ndb2 is busy, so we need to increase the max listeners
ndb2Bot.setMaxListeners(20);

ndb2Bot.login(mcconfig.discord.clients.ndb2.token);

export default ndb2Bot;
