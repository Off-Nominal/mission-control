import { add, isBefore } from "date-fns";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Interaction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { Client } from "pg";
import { Ndb2Subcommand } from "../../../commands/ndb2";
import ndb2MsgSubscriptionQueries, {
  Ndb2MsgSubscriptionType,
} from "../../../queries/ndb2_msg_subscriptions";
import { Ndb2Events } from "../../../types/eventEnums";
import { LogInitiator } from "../../../types/logEnums";
import { Logger, LogStatus } from "../../../utilities/logger";
import { ndb2Client } from "../../../utilities/ndb2Client";
import { NDB2API } from "../../../utilities/ndb2Client/types";
import { generatePredictionResponse } from "../actions/generatePredictionResponse";
// import { generateUserEmbed } from "../actions/generateUserEmbed";
// import { generateVoteEmbed } from "../actions/generateVoteEmbed";
// import { generateVoteResponse } from "../actions/generateVoteResponse";

export enum ButtonCommand {
  ENDORSE = "Endorse",
  UNDORSE = "Undorse",
  DETAILS = "Details",
  AFFIRM = "Affirm",
  NEGATE = "Negate",
  RETIRE = "Retire",
}
export default function generateHandleInteractionCreate(db: Client) {
  // const { addSubscription } = ndb2MsgSubscriptionQueries(db);

  return async function handleInteractionCreate(interaction: Interaction) {
    // Handle Modal Submissions for new Predictions
    if (interaction.isModalSubmit()) {
      const logger = new Logger(
        "NDB2 Interaction",
        LogInitiator.NDB2,
        "NDB2 Modal Interaction Handler"
      );

      logger.addLog(
        LogStatus.INFO,
        `Interaction is a Modal Submit - handing off to NEW_PREDICTION handler.`
      );
      logger.sendLog(interaction.client);
      return interaction.client.emit(Ndb2Events.NEW_PREDICTION, interaction);
    }

    // // Handle Button Submissions for Endorsements, Undorsements and Details
    if (interaction.isButton()) {
      const logger = new Logger(
        "NDB2 Interaction",
        LogInitiator.NDB2,
        "NDB2 Button Interaction Handler"
      );
      const [command, predictionId] = interaction.customId.split(" ");

      logger.addLog(
        LogStatus.INFO,
        `Interaction is a Button Submit - Command: ${command}, Prediction ID: ${predictionId}`
      );

      const isBet =
        command === ButtonCommand.ENDORSE || command === ButtonCommand.UNDORSE;

      // const isVote =
      //   command === ButtonCommand.AFFIRM || command === ButtonCommand.NEGATE;

      let prediction: NDB2API.EnhancedPrediction;

      try {
        prediction = await ndb2Client.getPrediction(predictionId);
        logger.addLog(
          LogStatus.SUCCESS,
          `Prediction was successfully retrieved from NDB2.`
        );
      } catch (err) {
        logger.addLog(
          LogStatus.WARNING,
          `Prediction does not exist, interaction rejected.`
        );
        logger.sendLog(interaction.client);
        return interaction.reply({
          content: "No prediction exists with that id.",
          ephemeral: true,
        });
      }

      if (isBet) {
        logger.addLog(
          LogStatus.INFO,
          `Interaction is a Bet Submit - handing off to NEW_BET handler.`
        );
        logger.sendLog(interaction.client);
        return interaction.client.emit(
          Ndb2Events.NEW_BET,
          interaction,
          predictionId,
          command
        );
      }

      if (command === ButtonCommand.DETAILS) {
        logger.addLog(
          LogStatus.INFO,
          `Interaction is a View Details request - handing off to VIEW_DETAILS handler.`
        );
        logger.sendLog(interaction.client);
        return interaction.client.emit(
          Ndb2Events.VIEW_DETAILS,
          interaction,
          predictionId
        );
      }

      if (command === ButtonCommand.RETIRE) {
        logger.addLog(
          LogStatus.INFO,
          `Interaction is a Retire Prediction request - handing off to RETIRE_PREDICTION handler.`
        );
        logger.sendLog(interaction.client);
        return interaction.client.emit(
          Ndb2Events.RETIRE_PREDICTION,
          interaction,
          predictionId
        );
      }

      // if (isVote) {
      //   const affirmed = command === ButtonCommand.AFFIRM;

      //   // Add Vote
      //   try {
      //     await addVote(discordId, predictionId, affirmed);
      //     interaction.reply({
      //       content: `Prediction successfully ${command.toLowerCase()}d!`,
      //       ephemeral: true,
      //     });
      //   } catch (err) {
      //     return interaction.reply({
      //       content: err.response.data.error,
      //       ephemeral: true,
      //     });
      //   }
      // }

      // // Update Embed with new stats
      // try {
      //   const buttonMsg = await interaction.message;
      //   const predictor = await interaction.guild.members.fetch(
      //     prediction.predictor.discord_id
      //   );

      //   const embed = generatePredictionEmbed(predictor.nickname, prediction);
      //   // : generateVoteEmbed(prediction);

      //   return await buttonMsg.edit({ embeds: [embed] });
      // } catch (err) {
      //   console.error(err);
      // }
    }

    if (!interaction.isChatInputCommand()) {
      const logger = new Logger(
        "NDB2 Interaction",
        LogInitiator.NDB2,
        "NDB2 Chat Input Command Interaction Handler"
      );

      logger.addLog(
        LogStatus.WARNING,
        `Received a Chat Input Command interaction, which is not supported.`
      );
      return logger.sendLog(interaction.client);
    }

    const logger = new Logger(
      "NDB2 Interaction",
      LogInitiator.NDB2,
      "NDB2 Slash Command Interaction Handler"
    );

    if (
      process.env.NODE_ENV !== "dev" &&
      interaction.channelId !== "1084942074991878174"
    ) {
      logger.addLog(
        LogStatus.WARNING,
        `User tried to invoke NDB2 outside the playground channel, which is not supported.`
      );
      logger.sendLog(interaction.client);
      return interaction.reply({
        content: "The new NDB2 is only available in the testing thread for now",
        ephemeral: true,
      });
    }

    const { options, commandName } = interaction;
    const subCommand = options.getSubcommand(false);

    if (commandName !== "predict") {
      logger.addLog(
        LogStatus.WARNING,
        `User invoked a command other than predict, which is not supported.`
      );
      logger.sendLog(interaction.client);
      return interaction.reply({
        content: "Invalid Command. Try `/predict help` to see how I work.",
        ephemeral: true,
      });
    }

    if (subCommand === Ndb2Subcommand.HELP) {
      // Help
    }

    if (subCommand === Ndb2Subcommand.NEW) {
      const modal = new ModalBuilder()
        .setCustomId("Prediction Modal")
        .setTitle("New Nostradambot2 Prediction");

      const textInput = new TextInputBuilder()
        .setCustomId("text")
        .setLabel("Prediction")
        .setPlaceholder("The Sun will rise tomorrow")
        .setRequired(true)
        .setStyle(TextInputStyle.Paragraph);

      const dueInput = new TextInputBuilder()
        .setCustomId("due")
        .setLabel("Prediction Due Date (UTC, format YYYY-MM-DD)")
        .setPlaceholder("YYYY-MM-DD")
        .setMaxLength(10)
        .setMinLength(10)
        .setRequired(true)
        .setStyle(TextInputStyle.Short);

      const firstActionRow =
        new ActionRowBuilder<TextInputBuilder>().addComponents(textInput);
      const secondActionRow =
        new ActionRowBuilder<TextInputBuilder>().addComponents(dueInput);

      modal.addComponents(firstActionRow, secondActionRow);

      logger.addLog(
        LogStatus.WARNING,
        `Received a NEW PREDICTION request, handing off to NEW PREDICTION handler.`
      );
      logger.sendLog(interaction.client);

      return await interaction.showModal(modal);
    }

    // if (subCommand === Ndb2Subcommand.SCORE) {
    //   const discordId = interaction.user.id;
    //   const interactor = await interaction.guild.members.fetch(discordId);

    //   try {
    //     const user = await getUser(discordId);
    //     const embed = generateUserEmbed(user, interactor.displayName);
    //     return interaction.reply({ embeds: [embed] });
    //   } catch (err) {
    //     console.error(err);
    //     return interaction.reply({
    //       content: err.response.data.error,
    //       ephemeral: true,
    //     });
    //   }
    // }

    // Prediction specific commands

    const predictionId = options.getInteger("id");

    if (subCommand === Ndb2Subcommand.RETIRE) {
      logger.addLog(
        LogStatus.INFO,
        `Received a RETIRE Prediction request, initiating confirmation message.`
      );
      logger.sendLog(interaction.client);

      const components = [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`Retire ${predictionId}`)
            .setLabel("Retire")
            .setStyle(ButtonStyle.Danger)
        ),
      ];

      const content = `Retiring a prediction can only be done in the first ${process.env.GM_PREDICTION_UPDATE_WINDOW_HOURS} hours of its creation. If you decide to proceed with the cancellation, a public notice of the cancellation will be posted, and all bets against it will be cancelled as well. If you understand and still want to continue, click the button below.`;

      return interaction.reply({ content, components, ephemeral: true });
    }

    let prediction: NDB2API.EnhancedPrediction;

    try {
      prediction = await ndb2Client.getPrediction(predictionId);
      logger.addLog(
        LogStatus.SUCCESS,
        `Prediction was successfully retrieved from NDB2.`
      );
    } catch (err) {
      logger.addLog(
        LogStatus.WARNING,
        `Prediction does not exist, interaction rejected.`
      );
      logger.sendLog(interaction.client);

      return interaction.reply({
        content: "No prediction exists with that id.",
        ephemeral: true,
      });
    }

    // if (subCommand === Ndb2Subcommand.TRIGGER) {
    //   const closer_discord_id = interaction.user.id;
    //   const closed = new Date(options.getString("closed"));

    //   // Validate date format
    //   const isDueDateValid = isValid(closed);
    //   if (!isDueDateValid) {
    //     return interaction.reply({
    //       content:
    //         "Your close date format was invalid. Ensure it is entered as YYYY-MM-DD",
    //       ephemeral: true,
    //     });
    //   }

    //   // Validate date is in the past
    //   if (isFuture(closed)) {
    //     return interaction.reply({
    //       content:
    //         "Your close date is in the future. Either leave it blank to trigger effective now, or put in a past date.",
    //       ephemeral: true,
    //     });
    //   }

    //   // Trigger prediction
    //   let triggeredPrediction: ClosePredictionResponse;

    //   try {
    //     triggeredPrediction = await triggerPrediction(
    //       predictionId,
    //       closer_discord_id,
    //       closed
    //     );
    //   } catch (err) {
    //     return interaction.reply({
    //       content: err.response.data.error,
    //       ephemeral: true,
    //     });
    //   }

    //   // Fetch channel for Prediction Message

    //   let voteChannel: Channel;
    //   try {
    //     voteChannel = await interaction.client.channels.fetch(
    //       triggeredPrediction.channel_id
    //     );
    //   } catch (err) {
    //     console.log(err);
    //     return interaction.reply({
    //       content: "Error fetching channel for voting.",
    //     });
    //   }

    //   if (voteChannel.type !== ChannelType.GuildText) {
    //     return interaction.reply({
    //       content: "Something went wrong. Tell Jake to check the logs.",
    //       ephemeral: true,
    //     });
    //   }

    //   // Send Voting Message
    //   let voteMessage: Message;

    //   try {
    //     const vote = generateVoteResponse(prediction, { closer_discord_id });
    //     voteMessage = await voteChannel.send(vote);
    //   } catch (err) {
    //     return interaction.reply({
    //       content: "Error sending vote to voting channel.",
    //       ephemeral: true,
    //     });
    //   }

    //   try {
    //     return interaction.reply({
    //       content: `Prediction #${predictionId} has been triggered. Voting will now occur in ${channelMention(
    //         voteChannel.id
    //       )}`,
    //     });
    //   } catch (err) {
    //     return interaction.reply({
    //       content: err.response.data.error,
    //     });
    //   }
    // }

    // if (
    //   subCommand === Ndb2Subcommand.ENDORSE ||
    //   subCommand === Ndb2Subcommand.UNDORSE
    // ) {
    //   const endorsed = subCommand === Ndb2Subcommand.ENDORSE;
    //   const discordId = interaction.member.user.id;

    //   try {
    //     await addBet(discordId, predictionId, endorsed);
    //     interaction.reply({
    //       content: `Prediction successfully ${subCommand}d!`,
    //       ephemeral: true,
    //     });
    //   } catch (err) {
    //     return interaction.reply({
    //       content: err.response.data.error,
    //       ephemeral: true,
    //     });
    //   }
    // }

    if (subCommand === Ndb2Subcommand.VIEW) {
      logger.addLog(
        LogStatus.INFO,
        `Received a View Prediction request, handing off to View Prediction handler.`
      );
      logger.sendLog(interaction.client);
      return interaction.client.emit(
        Ndb2Events.VIEW_PREDICTION,
        interaction,
        prediction
      );
    }

    logger.addLog(
      LogStatus.WARNING,
      "This code should be unreachable, something weird happened."
    );

    interaction.reply({
      content:
        "Something went wrong and I didn't now how to handle this request, please tell Jake",
    });

    logger.sendLog(interaction.client);
  };
}
