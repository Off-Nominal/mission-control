import {
  ActionRowBuilder,
  APIEmbedField,
  BaseMessageOptions,
  ButtonBuilder,
  EmbedBuilder,
  time,
  TimestampStyles,
} from "discord.js";
import {
  NDB2API,
  PredictionLifeCycle,
} from "../../../../../providers/ndb2-client";
import {
  getDetailsButton,
  getSnoozeButton,
  getWebButton,
} from "./helpers/buttons";
import { NDB2EmbedTemplate } from "./helpers/types";
import embedFields from "./helpers/fields";
import { getAuthor, getThumbnail } from "./helpers/helpers";

const titles = {
  [PredictionLifeCycle.CHECKING]: "Just checking in...",
  [PredictionLifeCycle.CLOSED]: "Thanks for letting me know",
  [PredictionLifeCycle.OPEN]: "Thanks for letting me know",
};

const getDescription = (
  status:
    | PredictionLifeCycle.CHECKING
    | PredictionLifeCycle.CLOSED
    | PredictionLifeCycle.OPEN,
  prediction: NDB2API.EnhancedPrediction
): string => {
  const newCheckDate = new Date(prediction.check_date || 0);
  const snoozeCount = prediction.checks.filter((sc) => sc.closed).length;

  const descriptions = {
    [PredictionLifeCycle.CHECKING]: `Prediction #${prediction.id} has reached a check-in date. Please let me know what we should do with it!`,
    [PredictionLifeCycle.CLOSED]: `Prediction #${prediction.id} has been triggered!`,
    [PredictionLifeCycle.OPEN]: `I've snoozed prediction #${
      prediction.id
    } until later. I'll check in again on ${time(
      newCheckDate,
      TimestampStyles.LongDate
    )} (${time(
      newCheckDate,
      TimestampStyles.RelativeTime
    )}). This prediction has now been snoozed ${snoozeCount} times.`,
  };

  return descriptions[status];
};

export const generateSnoozeCheckEmbed = (
  props: NDB2EmbedTemplate.Args.SnoozeCheck
): BaseMessageOptions["embeds"] => {
  if (
    props.prediction.status !== PredictionLifeCycle.CHECKING &&
    props.prediction.status !== PredictionLifeCycle.CLOSED &&
    props.prediction.status !== PredictionLifeCycle.OPEN
  ) {
    return [];
  }

  const created = new Date(props.prediction.created_date);

  const title = titles[props.prediction.status];

  const description = getDescription(props.prediction.status, props.prediction);

  const embed = new EmbedBuilder({
    author: getAuthor(props.client),
    thumbnail: {
      url: getThumbnail(props.prediction.status),
    },
    title,
    description,
    footer: {
      text: `Prediction ID: ${props.prediction.id}`,
    },
  });

  // Base Fields
  const fields: APIEmbedField[] = [
    {
      name: "Prediction",
      value: props.prediction.text + `\n \u200B`,
    },
    embedFields.date(created, "Created", { context: props.context }),
  ];

  if (props.prediction.status === PredictionLifeCycle.CHECKING) {
    fields.push({
      name: "Is this prediction ready to be triggered?",
      value:
        "If so, please trigger it using the regular NDB command (`/predict trigger`) and provide the appropriate backdate for the trigger.",
    });
    fields.push({
      name: "Want me to check back later?",
      value:
        "Choose the most appropriate snooze duration below to have me check back later. I'll use the first option that gets three votes.",
    });
  }

  embed.setFields(fields);

  return [embed];
};

export const generateSnoozeCheckComponents = (
  prediction: NDB2API.EnhancedPrediction
): BaseMessageOptions["components"] => {
  const actionRow = new ActionRowBuilder<ButtonBuilder>();
  const actionRow2 = new ActionRowBuilder<ButtonBuilder>();

  if (prediction.status === PredictionLifeCycle.CHECKING) {
    const check = prediction.checks.find((sc) => sc.closed == false);
    if (!check) {
      throw new Error("No open snooze check found");
    }
    actionRow.addComponents(
      getSnoozeButton(prediction.id, check.id, 1, check.values.day, "1 Day"),
      getSnoozeButton(prediction.id, check.id, 7, check.values.week, "1 Week"),
      getSnoozeButton(
        prediction.id,
        check.id,
        30,
        check.values.month,
        "1 Month"
      ),
      getSnoozeButton(
        prediction.id,
        check.id,
        90,
        check.values.quarter,
        "1 Quarter"
      ),
      getSnoozeButton(prediction.id, check.id, 365, check.values.year, "1 Year")
    );

    actionRow2.addComponents(getWebButton(prediction.id));

    return [actionRow, actionRow2];
  } else {
    actionRow.addComponents(
      getDetailsButton(prediction.id, "Season", "Details"),
      getWebButton(prediction.id)
    );
    return [actionRow];
  }
};
