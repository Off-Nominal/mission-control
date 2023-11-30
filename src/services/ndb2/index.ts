import { LogInitiator, LogStatus, Logger } from "../../logger/Logger";
import { Providers } from "../../providers";
import createWebooksRouter from "./webhooks";
import AddBet from "./add-bet";
import AddPrediction from "./add-prediction";
import AddVote from "./add-vote";
import ViewDetails from "./view-details";
import ViewScore from "./view-score";
import ViewPrediction from "./view-prediction";
import ViewPredictions from "./view-predictions";
import RetirePrediction from "./retire-prediction";
import ViewLeaderboards from "./view-leaderboards";
import SearchPredictions from "./search-predictions";
import TriggerPrediction from "./trigger-prediction";

export default function NDB2(providers: Providers) {
  const { api, ndb2Bot, models } = providers;
  api.use(
    "/webhooks",
    createWebooksRouter(ndb2Bot, models.ndb2MsgSubscription)
  );

  // handles incorrect slash commands
  // NDB2 only handles `predict` namespace
  ndb2Bot.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) {
      return;
    }

    const { commandName } = interaction;

    if (commandName !== "predict") {
      const logger = new Logger(
        "NDB2 Interaction",
        LogInitiator.NDB2,
        "NDB2 Interaction Unhandled"
      );

      logger.addLog(
        LogStatus.WARNING,
        `User invoked a command other than predict, which is not supported.`
      );
      logger.sendLog(interaction.client);

      interaction.reply({
        content: "Invalid Command. Try `/predict help` to see how I work.",
        ephemeral: true,
      });
    }
  });

  AddPrediction(providers);
  AddBet(providers);
  AddVote(providers);
  ViewDetails(providers);
  ViewPrediction(providers);
  ViewPredictions(providers);
  ViewScore(providers);
  ViewLeaderboards(providers);
  SearchPredictions(providers);
  RetirePrediction(providers);
  TriggerPrediction(providers);
}
