import { isFuture, isValid } from "date-fns";
import { ModalSubmitInteraction } from "discord.js";
import queries from "../../../utilities/ndb2Client/queries/index";
import { generatePredictionResponse } from "../actions/generatePredictionResponse";
const { addPrediction } = queries;

export default async function handleNewPrediction(
  interaction: ModalSubmitInteraction
) {
  const text = interaction.fields.getTextInputValue("text");
  const due = interaction.fields.getTextInputValue("due");
  const discordId = interaction.member.user.id;
  const messageId = interaction.channel.lastMessageId;
  const channelId = interaction.channelId;

  // Validate date format
  const isDueDateValid = isValid(new Date(due));
  if (!isDueDateValid) {
    return interaction.reply({
      content:
        "Your Due date format was invalid. Ensure it is entered as YYYY-MM-DD",
      ephemeral: true,
    });
  }

  // Validate date is in the future
  if (!isFuture(new Date(due))) {
    return interaction.reply({
      content:
        "Your due date is in the past. Predictions are for the future. Please try again.",
      ephemeral: true,
    });
  }

  try {
    const prediction = await addPrediction(
      discordId,
      text,
      due,
      messageId,
      channelId
    );
    const reply = await generatePredictionResponse(interaction, prediction);
    interaction.reply(reply);
  } catch (err) {
    console.error(err);
  }

  return;
}
