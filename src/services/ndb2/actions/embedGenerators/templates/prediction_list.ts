import {
  APIEmbedField,
  ActionRowBuilder,
  BaseMessageOptions,
  ButtonBuilder,
  EmbedBuilder,
  TimestampStyles,
  time,
} from "discord.js";
import { NDB2EmbedTemplate } from "./helpers/types";
import { getAdvancedSearchButton } from "./helpers/buttons";

const MAX_TEXT_LENGTH = 500;

export const generatePredictionListEmbed = (
  props: NDB2EmbedTemplate.Args.List
): BaseMessageOptions["embeds"] => {
  let title: string = "";
  let description: string = "";
  const options = props.options ?? {};

  if (props.type === "recent") {
    title = "Recently made open predictions";
    description =
      "Here are the ten most recently made predictions which are still open for betting.";
  }

  if (props.type === "upcoming") {
    title = "Upcoming Judgements";
    description =
      "Here are the next ten predictions that are due to be judged.";
  }

  if (props.type === "upcoming-mine") {
    title = "Your Upcoming Judgements";
    description =
      "Here are your next ten predictions that are due to be judged.";
  }

  if (props.type === "upcoming-no-bet") {
    title = "Upcoming Judgements (No Bet)";
    description =
      "Here are the next ten predictions that are due to be judged that you haven't yet placed a bet for.";
  }

  if (props.type === "search") {
    title = "Search Results";
    description = `Here are the best ten prediction matches for keyword: ${options.keyword}`;
  }

  const fields: APIEmbedField[] = props.predictions.map((pred) => {
    let date: Date = new Date();
    let titleDate: string = "";

    if (props.type === "recent") {
      date = new Date(pred.created_date);
      titleDate = "Created";
    }
    if (
      props.type === "upcoming" ||
      props.type === "upcoming-mine" ||
      props.type === "upcoming-no-bet" ||
      props.type === "search"
    ) {
      date = new Date(pred.due_date || pred.check_date);
      titleDate = pred.driver === "date" ? "Due" : "Checking";
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

  return [embed];
};

export const generatePredictionListComponents =
  (): BaseMessageOptions["components"] => {
    const actionRow = new ActionRowBuilder<ButtonBuilder>();
    actionRow.addComponents(getAdvancedSearchButton());

    return [actionRow];
  };
