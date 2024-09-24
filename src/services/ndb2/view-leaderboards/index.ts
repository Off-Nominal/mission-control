import { LogInitiator, LogStatus, Logger } from "../../../logger/Logger";
import { Providers } from "../../../providers";
import { NDB2API } from "../../../providers/ndb2-client";
import { generateInteractionReplyFromTemplate } from "../actions/embedGenerators/templates";
import { NDB2EmbedTemplate } from "../actions/embedGenerators/templates/helpers/types";

export default function ViewLeaderboards({ ndb2Bot, ndb2Client }: Providers) {
  ndb2Bot.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) {
      return;
    }

    const { options, commandName } = interaction;
    const subCommand = options.getSubcommand(false);

    if (commandName !== "predict" || subCommand !== "leaderboards") {
      return;
    }

    const leaderboardType = options.getString("type", true);
    const brag = options.getBoolean("brag");
    const window = options.getString("window") || "current";
    let seasonIdentifier: undefined | "current" | "last";

    if (window === "current") {
      seasonIdentifier = "current";
    }

    if (window === "last") {
      seasonIdentifier = "last";
    }

    const logger = new Logger(
      "NDB2 Interaction",
      LogInitiator.NDB2,
      `View Leaderboards: ${leaderboardType}`
    );

    // Leaderboard calculcations can sometimes take time, this deferred reply let's discord know we're working on it!
    try {
      await interaction.deferReply({ ephemeral: !brag });
      logger.addLog(LogStatus.SUCCESS, "Successfully deferred reply.");
    } catch (err) {
      logger.addLog(LogStatus.FAILURE, "Failed to defer reply, aborting.");
      logger.sendLog(interaction.client);
      return;
    }

    if (
      leaderboardType !== "points" &&
      leaderboardType !== "bets" &&
      leaderboardType !== "predictions"
    ) {
      logger.addLog(
        LogStatus.FAILURE,
        `Invalid interaction option: Type: ${leaderboardType}`
      );
      interaction.editReply({
        content:
          "This is an invalid option. Type can only be 'points', 'predictions' or 'bets'",
      });
      return;
    }

    try {
      let response:
        | NDB2API.GetPredictionsLeaderboard
        | NDB2API.GetBetsLeaderboard
        | NDB2API.GetPointsLeaderboard;

      let options: NDB2EmbedTemplate.Args.Leaderboard;

      if (leaderboardType === "predictions") {
        response = await ndb2Client.getPredictionsLeaderboard(seasonIdentifier);
        options = {
          type: leaderboardType,
          leaders: response.data.leaders,
          seasonIdentifier,
        };
      } else if (leaderboardType === "bets") {
        response = await ndb2Client.getBetsLeaderboard(seasonIdentifier);
        options = {
          type: leaderboardType,
          leaders: response.data.leaders,
          seasonIdentifier,
        };
      } else if (leaderboardType === "points") {
        response = await ndb2Client.getPointsLeaderboard(seasonIdentifier);
        options = {
          type: leaderboardType,
          leaders: response.data.leaders,
          seasonIdentifier,
        };
      }

      logger.addLog(
        LogStatus.SUCCESS,
        "Successfully fetched leaderboard from API."
      );

      const leaders = response.data.leaders;

      const [embeds, components] = generateInteractionReplyFromTemplate(
        NDB2EmbedTemplate.View.LEADERBOARD,
        options
      );

      await interaction.editReply({ embeds, components });
      logger.addLog(
        LogStatus.SUCCESS,
        "Successfully posted leaderboard embed to Discord"
      );
    } catch (err) {
      logger.addLog(LogStatus.FAILURE, "Failed to fetch leaderboard from API");
    }

    logger.sendLog(interaction.client);
  });
}
