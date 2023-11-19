import {
  ButtonInteraction,
  CacheType,
  ChatInputCommandInteraction,
  Client,
  Events,
  ModalSubmitInteraction,
} from "discord.js";
import mcconfig from "../../mcconfig";
import handlers from "../../clients/handlers";
import { NDB2API } from "../ndb2-client";
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

ndb2Bot.login(mcconfig.discord.clients.ndb2.token);

// ndb2Bot.on(Events.InteractionCreate, (interaction) => {
//   handlers.ndb2.handleInteractionCreate(interaction);
// });

// ndb2Bot.on(Ndb2Events.NEW_PREDICTION, (interaction: ModalSubmitInteraction) => {
//   handlers.ndb2.handleNewPrediction(interaction);
// });
// ndb2Bot.on(
//   Ndb2Events.VIEW_PREDICTION,
//   (
//     interaction: ChatInputCommandInteraction<CacheType>,
//     prediction: NDB2API.EnhancedPrediction
//   ) => {
//     handlers.ndb2.handleViewPrediction(interaction, prediction);
//   }
// );
// ndb2Bot.on(
//   Ndb2Events.VIEW_DETAILS,
//   (interaction: ButtonInteraction, predictionId: string, season: boolean) => {
//     handlers.ndb2.handleViewDetails(interaction, predictionId, season);
//   }
// );
// ndb2Bot.on(
//   Ndb2Events.NEW_BET,
//   (interaction: ButtonInteraction, predictionId: string, command: string) => {
//     handlers.ndb2.handleNewBet(interaction, predictionId, command);
//   }
// );
// ndb2Bot.on(
//   Ndb2Events.RETIRE_PREDICTION,
//   (interaction: ButtonInteraction, predictionId: string) => {
//     handlers.ndb2.handleRetirePrediction(interaction, predictionId);
//   }
// );
// ndb2Bot.on(
//   Ndb2Events.TRIGGER_PREDICTION,
//   (
//     interaction: ButtonInteraction,
//     predictionId: string,
//     closed_date?: string
//   ) => {
//     handlers.ndb2.handleTriggerPrediction(
//       interaction,
//       predictionId,
//       closed_date
//     );
//   }
// );
// ndb2Bot.on(
//   Ndb2Events.NEW_VOTE,
//   (interaction: ButtonInteraction, predictionId: string, command: string) => {
//     handlers.ndb2.handleNewVote(interaction, predictionId, command);
//   }
// );
// ndb2Bot.on(
//   Ndb2Events.VIEW_SCORE,
//   (interaction: ChatInputCommandInteraction<CacheType>) => {
//     handlers.ndb2.handleViewScore(interaction);
//   }
// );
// ndb2Bot.on(
//   Ndb2Events.LIST_PREDICTIONS,
//   (interaction: ChatInputCommandInteraction<CacheType>) => {
//     handlers.ndb2.handleListPredictions(interaction);
//   }
// );
// ndb2Bot.on(
//   Ndb2Events.SEARCH_PREDICTIONS,
//   (interaction: ChatInputCommandInteraction<CacheType>) => {
//     handlers.ndb2.handleSearchPredictions(interaction);
//   }
// );
// ndb2Bot.on(
//   Ndb2Events.VIEW_LEADERBOARDS,
//   (interaction: ChatInputCommandInteraction<CacheType>) => {
//     handlers.ndb2.handleViewLeaderboards(interaction);
//   }
// );

export default ndb2Bot;
