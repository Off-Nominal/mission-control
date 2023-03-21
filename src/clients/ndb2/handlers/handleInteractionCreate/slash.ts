import {
  ActionRowBuilder,
  ButtonBuilder,
  ModalBuilder,
  TextInputBuilder,
} from "@discordjs/builders";
import {
  ButtonStyle,
  ChatInputCommandInteraction,
  TextInputStyle,
} from "discord.js";
import { Ndb2Subcommand } from "../../../../commands/ndb2";
import { LogInitiator } from "../../../../types/logEnums";
import { Logger, LogStatus } from "../../../../utilities/logger";
import { ndb2Client } from "../../../../utilities/ndb2Client";
import { NDB2API } from "../../../../utilities/ndb2Client/types";
import ndb2InteractionCache from "../../../../utilities/ndb2Client/ndb2InteractionCache";
import { Ndb2Events } from "../../../../types/eventEnums";

export const handleSlashCommandInteraction = async (
  interaction: ChatInputCommandInteraction
) => {
  const logger = new Logger(
    "NDB2 Interaction",
    LogInitiator.NDB2,
    "NDB2 Slash Command Interaction Handler"
  );

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
      .setMaxLength(2048)
      .setRequired(true)
      .setStyle(TextInputStyle.Paragraph);

    const dueInput = new TextInputBuilder()
      .setCustomId("due")
      .setLabel("Prediction Due Date (UTC, format YYYY-MM-DD)")
      .setPlaceholder("YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD")
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
      LogStatus.INFO,
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

    const content = `Retiring a prediction can only be done in the first ${process.env.GM_PREDICTION_UPDATE_WINDOW_HOURS} hours of its creation. If you decide to proceed with the cancellation, a public notice of the cancellation will be posted, and all bets against it will be cancelled as well. If you understand and still want to continue, click the button below.\n\nHere is the prediction you are about to retire:\n\n${prediction.text}`;

    if (ndb2InteractionCache.retirements[prediction.id]) {
      ndb2InteractionCache.retirements[prediction.id].deleteReply();
    }
    ndb2InteractionCache.retirements[prediction.id] = interaction;

    return interaction.reply({ content, components, ephemeral: true });
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
