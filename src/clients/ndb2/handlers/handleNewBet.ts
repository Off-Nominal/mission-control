import { ButtonInteraction } from "discord.js";
import { ndb2Client } from "../../../utilities/ndb2Client";
import { NDB2API } from "../../../utilities/ndb2Client/types";
import { ButtonCommand } from "./handleInteractionCreate";

export default async function handleNewBet(
  interaction: ButtonInteraction,
  predictionId: string,
  command: string
) {
  const discordId = interaction.member.user.id;
  const endorsed = command === ButtonCommand.ENDORSE;

  let prediction: NDB2API.EnhancedPrediction;

  // Add Bet
  try {
    prediction = await ndb2Client.addBet(predictionId, discordId, endorsed);
    interaction.reply({
      content: `Prediction successfully ${command.toLowerCase()}d!`,
      ephemeral: true,
    });
  } catch (err) {
    console.log(err);
    return interaction.reply({
      content: err.response.data.message,
      ephemeral: true,
    });
  }
}
