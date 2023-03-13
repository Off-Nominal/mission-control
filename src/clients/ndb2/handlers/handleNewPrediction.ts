import { add, format, isFuture, isValid } from "date-fns";
import { ModalSubmitInteraction } from "discord.js";
import { generatePredictionResponse } from "../actions/generatePredictionResponse";
import { ndb2Client } from "../../../utilities/ndb2Client";

export default async function handleNewPrediction(
  interaction: ModalSubmitInteraction
) {
  const text = interaction.fields.getTextInputValue("text");
  const due = new Date(interaction.fields.getTextInputValue("due"));
  const discordId = interaction.member.user.id;
  // const messageId = interaction.channel.lastMessageId;
  // const channelId = interaction.channelId;

  // Validate date format
  const isDueDateValid = isValid(new Date(due));
  if (!isDueDateValid) {
    return interaction.reply({
      content:
        "Your Due date format was invalid. Ensure it is entered as YYYY-MM-DD",
      ephemeral: true,
    });
  }

  const due_date = add(due, { days: 1 });

  // Validate date is in the future
  if (!isFuture(due_date)) {
    return interaction.reply({
      content: `Your due date is in the past. Please adjust your date and try again.`,
      ephemeral: true,
    });
  }

  try {
    const prediction = await ndb2Client.addPrediction(
      discordId,
      text,
      due_date.toISOString()
    );
    const reply = await generatePredictionResponse(interaction, prediction);
    interaction.reply(reply);
  } catch (err) {
    console.error(err);
  }

  return;
}
