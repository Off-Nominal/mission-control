import {
  ButtonInteraction,
  channelMention,
  GuildMember,
  messageLink,
  time,
  userMention,
} from "discord.js";
import { Client } from "pg";
import ndb2MsgSubscriptionQueries, {
  Ndb2MsgSubscriptionType,
} from "../../../queries/ndb2_msg_subscriptions";
import { LogInitiator } from "../../../types/logEnums";
import { Logger, LogStatus } from "../../../utilities/logger";
import { ndb2Client } from "../../../utilities/ndb2Client";
import { NDB2API } from "../../../utilities/ndb2Client/types";
import { generatePredictionDetailsEmbed } from "../actions/generatePredictionDetailsEmbed";
import { generatePredictionEmbed } from "../actions/generatePredictionEmbed";
import { ButtonCommand } from "./handleInteractionCreate";

export default function generateHandleNewBet(db: Client) {
  const { fetchSubs } = ndb2MsgSubscriptionQueries(db);

  return async function handleNewBet(
    interaction: ButtonInteraction,
    predictionId: string,
    command: string
  ) {
    const logger = new Logger("NDB2 Interaction", LogInitiator.NDB2, "New Bet");

    const discordId = interaction.member.user.id;
    const endorsed = command === ButtonCommand.ENDORSE;

    logger.addLog(
      LogStatus.INFO,
      `New ${command} made by ${userMention(
        discordId
      )} on prediction #${predictionId}`
    );

    let prediction: NDB2API.EnhancedPrediction;

    // Add Bet
    try {
      prediction = await ndb2Client.addBet(predictionId, discordId, endorsed);
      logger.addLog(
        LogStatus.SUCCESS,
        `Bet was successfully submitted to NDB2`
      );
    } catch (err) {
      logger.addLog(
        LogStatus.FAILURE,
        `There was an error submitting the bet. ${err.response.data.message}`
      );
      console.error(err);
      return interaction.reply({
        ephemeral: true,
        content: `There was an error submitting the bet to NDB2. ${err.response.data.message}`,
      });
    }

    try {
      interaction.reply({
        content: `Prediction #${predictionId} successfully ${command.toLowerCase()}d!`,
        ephemeral: true,
      });
      logger.addLog(
        LogStatus.SUCCESS,
        `Successfully notified user of bet success.`
      );
    } catch (err) {
      console.log(err);
      logger.addLog(
        LogStatus.FAILURE,
        `There was an error responding to the prediction in the channel, but the prediction was submitted. ${err.response.data.message}`
      );
    }

    // Fetch subscriptions and update any embeds
    try {
      const subs = await fetchSubs(prediction.id);
      logger.addLog(
        LogStatus.INFO,
        `Fetched ${subs.length} message subscriptions to update.`
      );

      const updates = [];

      for (const sub of subs) {
        const viewUpdate = [];

        const message = interaction.guild.channels
          .fetch(sub.channel_id)
          .then((channel) => {
            if (channel.isTextBased()) {
              return channel.messages.fetch(sub.message_id);
            }
          });

        viewUpdate.push(message);

        if (sub.type === Ndb2MsgSubscriptionType.VIEW) {
          const predictor = interaction.guild.members.fetch(
            prediction.predictor.discord_id
          );

          viewUpdate.push(predictor);

          const update = Promise.all(viewUpdate)
            .then(([message, predictor]) => {
              const embed = generatePredictionEmbed(
                predictor.displayName,
                predictor.displayAvatarURL(),
                prediction
              );
              return message.edit({ embeds: [embed] });
            })
            .catch((err) => {
              logger.addLog(
                LogStatus.FAILURE,
                `Message subscription in channel ${channelMention(
                  sub.channel_id
                )} message ${messageLink(
                  sub.channel_id,
                  sub.message_id
                )} failed to update.`
              );
              console.error(err);
            });

          updates.push(update);
        }
      }

      Promise.all(updates).then(() => {
        logger.addLog(
          LogStatus.INFO,
          `All ${subs.length} message subscriptions successfully updated.`
        );
      });
    } catch (err) {
      console.error(err);
    }

    logger.sendLog(interaction.client);
  };
}
