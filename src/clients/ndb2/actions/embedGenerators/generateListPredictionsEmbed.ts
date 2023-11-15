import { APIEmbedField, EmbedBuilder, TimestampStyles, time } from "discord.js";
import { NDB2API } from "../../../../providers/ndb2";

const MAX_TEXT_LENGTH = 500;

export const generateListPredictionsEmbed = (
  type: "recent" | "upcoming" | "upcoming-mine" | "upcoming-no-bet" | "search",
  predictions: NDB2API.ShortEnhancedPrediction[],
  options: {
    keyword?: string;
  } = {}
): EmbedBuilder => {
  let title: string;
  let description: string;
  let titleDate: "Created" | "Due";

  if (type === "recent") {
    title = "Recently made open predictions";
    description =
      "Here are the ten most recently made predictions which are still open for betting.";
    titleDate = "Created";
  }

  if (type === "upcoming") {
    title = "Upcoming Judgements";
    description =
      "Here are the next ten predictions that are due to be judged.";
    titleDate = "Due";
  }

  if (type === "upcoming-mine") {
    title = "Your Upcoming Judgements";
    description =
      "Here are your next ten predictions that are due to be judged.";
    titleDate = "Due";
  }

  if (type === "upcoming-no-bet") {
    title = "Upcoming Judgements (No Bet)";
    description =
      "Here are the next ten predictions that are due to be judged that you haven't yet placed a bet for.";
    titleDate = "Due";
  }

  if (type === "search") {
    title = "Search Results";
    description = `Here are the best ten prediction matches for keyword: ${options.keyword}`;
    titleDate = "Due";
  }

  const fields: APIEmbedField[] = predictions.map((pred) => {
    let date: Date;

    if (type === "recent") {
      date = new Date(pred.created_date);
    }
    if (
      type === "upcoming" ||
      type === "upcoming-mine" ||
      type === "upcoming-no-bet" ||
      type === "search"
    ) {
      date = new Date(pred.due_date);
    }

    let value: string;

    if (pred.text.length > MAX_TEXT_LENGTH) {
      value = pred.text.slice(0, MAX_TEXT_LENGTH) + "...";
    } else {
      value = pred.text;
    }

    return {
      name: `#${pred.id} - ${titleDate} ${time(
        date,
        TimestampStyles.RelativeTime
      )}`,
      value,
    };
  });

  const embed = new EmbedBuilder({
    title,
    description,
    fields,
  });

  return embed;
};
