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
  getDetailsButton,
  getSnoozeButton,
  getWebButton,
} from "./helpers/buttons";
import { NDB2EmbedTemplate } from "./helpers/types";
import embedFields from "./helpers/fields";
import { getAuthor, getThumbnail } from "./helpers/helpers";
import * as NDB2API from "@offnominal/ndb2-api-types/v2";

const titles = {
  checking: "Just checking in...",
  closed: "Thanks for letting me know",
  open: "Thanks for letting me know",
};

interface GetDescriptionChecksProps {
  closed: boolean;
}

interface GetDescriptionPredictionProps {
  id: number;
  check_date: string;
  checks: GetDescriptionChecksProps[];
}

const getDescription = (
  status: "checking" | "closed" | "open",
  prediction: GetDescriptionPredictionProps,
): string => {
  const newCheckDate = new Date(prediction.check_date || 0);
  const snoozeCount = prediction.checks.filter((sc) => sc.closed).length;

  const descriptions = {
    ["checking"]: `Prediction #${prediction.id} has reached a check-in date. Please let me know what we should do with it!`,
    ["closed"]: `Prediction #${prediction.id} has been triggered!`,
    ["open"]: `I've snoozed prediction #${
      prediction.id
    } until later. I'll check in again on ${time(
      newCheckDate,
      TimestampStyles.LongDate,
    )} (${time(
      newCheckDate,
      TimestampStyles.RelativeTime,
    )}). This prediction has now been snoozed ${snoozeCount} times.`,
  };

  return descriptions[status];
};

export const generateSnoozeCheckEmbed = (
  props: NDB2EmbedTemplate.Args.SnoozeCheck,
): BaseMessageOptions["embeds"] => {
  if (
    props.prediction.status !== "checking" &&
    props.prediction.status !== "closed" &&
    props.prediction.status !== "open"
  ) {
    return [];
  }

  if (props.prediction.driver !== "event") {
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
    footer: embedFields.standardFooter(
      props.prediction.id,
      props.prediction.driver,
    ),
  });

  // Base Fields
  const fields: APIEmbedField[] = [
    {
      name: "Prediction",
      value: props.prediction.text + `\n \u200B`,
    },
    embedFields.date(created, "Created", { context: props.context }),
  ];

  if (props.prediction.status === "checking") {
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

interface SnoozeCheckComponentsProps {
  id: number;
  status: NDB2API.Entities.Predictions.PredictionLifeCycle;
  checks: NDB2API.Entities.Predictions.Prediction["checks"];
}

export const generateSnoozeCheckComponents = (
  props: SnoozeCheckComponentsProps,
): BaseMessageOptions["components"] => {
  const actionRow = new ActionRowBuilder<ButtonBuilder>();
  const actionRow2 = new ActionRowBuilder<ButtonBuilder>();

  if (props.status === "checking") {
    const check = props.checks.find((sc) => sc.closed == false);
    if (!check) {
      throw new Error("No open snooze check found");
    }
    actionRow.addComponents(
      getSnoozeButton(props.id, check.id, 1, check.values.day, "1 Day"),
      getSnoozeButton(props.id, check.id, 7, check.values.week, "1 Week"),
      getSnoozeButton(props.id, check.id, 30, check.values.month, "1 Month"),
      getSnoozeButton(
        props.id,
        check.id,
        90,
        check.values.quarter,
        "1 Quarter",
      ),
      getSnoozeButton(props.id, check.id, 365, check.values.year, "1 Year"),
    );

    actionRow2.addComponents(getWebButton(props.id));

    return [actionRow, actionRow2];
  } else {
    actionRow.addComponents(
      getDetailsButton(props.id, "Season", "Details"),
      getWebButton(props.id),
    );
    return [actionRow];
  }
};
