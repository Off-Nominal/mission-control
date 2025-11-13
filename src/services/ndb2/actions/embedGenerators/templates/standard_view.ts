import {
  APIEmbedField,
  EmbedBuilder,
  ActionRowBuilder,
  BaseMessageOptions,
  ButtonBuilder,
} from "discord.js";
import embedFields from "./helpers/fields";
import { getPredictedPrefix, getThumbnail } from "./helpers/helpers";
import {
  NDB2API as NDB2API_V1,
  PredictionLifeCycle,
} from "../../../../../providers/ndb2-client";
import { NDB2EmbedTemplate } from "./helpers/types";
import {
  getAffirmButton,
  getDetailsButton,
  getEndorseButton,
  getNegateButton,
  getUndorseButton,
  getWebButton,
} from "./helpers/buttons";
import * as NDB2API from "@offnominal/ndb2-api-types/v2";

export const generateStandardViewEmbed = (
  props: NDB2EmbedTemplate.Args.Standard
): BaseMessageOptions["embeds"] => {
  const created = new Date(props.prediction.created_date);
  const closed = new Date(props.prediction.closed_date || 0);
  const due = new Date(props.prediction.due_date || 0);
  const check = new Date(props.prediction.check_date || 0);
  const retired = new Date(props.prediction.retired_date || 0);
  const triggered = new Date(props.prediction.triggered_date || 0);

  const endorsements = props.prediction.bets.filter(
    (bet) => bet.endorsed && bet.valid
  );
  const undorsements = props.prediction.bets.filter(
    (bet) => !bet.endorsed && bet.valid
  );

  const yesVotes = props.prediction.votes.filter((vote) => vote.vote);
  const noVotes = props.prediction.votes.filter((vote) => !vote.vote);

  const embed = new EmbedBuilder({
    author: {
      name: `${
        props.displayName || "A former discord member"
      } ${getPredictedPrefix(props.prediction.status)}`,
      icon_url: props.avatarUrl,
    },
    description: props.prediction.text,
    thumbnail: {
      url: getThumbnail(props.prediction.status),
    },
    footer: embedFields.standardFooter(
      props.prediction.id,
      props.prediction.driver
    ),
  });

  // Base Fields
  const fields: APIEmbedField[] = [
    embedFields.date(created, "Created", { context: props.context }),
  ];

  if (props.prediction.status === PredictionLifeCycle.CLOSED) {
    if (props.prediction.driver === "date") {
      fields.push(embedFields.date(due, "Original Due Date"));
    }
    props.prediction.triggerer &&
      fields.push(
        embedFields.triggeredDate(
          triggered,
          `Vote Triggered`,
          props.prediction.triggerer.discord_id
        )
      );
    fields.push(embedFields.date(closed, "Effective Close Date"));
    fields.push(
      embedFields.season(
        props.prediction.season_id,
        props.prediction.season_applicable
      )
    );
    fields.push(
      embedFields.shortBets(
        endorsements.length,
        undorsements.length,
        props.prediction.payouts
      )
    );
    fields.push(embedFields.votingNotice());
    fields.push(embedFields.shortVotes(yesVotes.length, noVotes.length));
  }

  if (props.prediction.status === PredictionLifeCycle.SUCCESSFUL) {
    fields.push(embedFields.date(closed, "Effective Close Date"));
    fields.push(
      embedFields.season(
        props.prediction.season_id,
        props.prediction.season_applicable
      )
    );
    fields.push(
      embedFields.shortBets(
        endorsements.length,
        undorsements.length,
        props.prediction.payouts
      )
    );
    fields.push(embedFields.shortVotes(yesVotes.length, noVotes.length));
  }

  if (props.prediction.status === PredictionLifeCycle.FAILED) {
    fields.push(embedFields.date(closed, "Effective Close Date"));
    fields.push(
      embedFields.season(
        props.prediction.season_id,
        props.prediction.season_applicable
      )
    );
    fields.push(
      embedFields.shortBets(
        endorsements.length,
        undorsements.length,
        props.prediction.payouts
      )
    );
    fields.push(embedFields.shortVotes(yesVotes.length, noVotes.length));
  }

  if (
    props.prediction.status === PredictionLifeCycle.OPEN ||
    props.prediction.status === PredictionLifeCycle.CHECKING
  ) {
    if (props.prediction.driver === "date") {
      fields.push(embedFields.date(due, "Due Date"));
    } else {
      fields.push(embedFields.date(check, "Check Date"));
    }
    fields.push(
      embedFields.season(
        props.prediction.season_id,
        props.prediction.season_applicable
      )
    );
    fields.push(
      embedFields.shortBets(
        endorsements.length,
        undorsements.length,
        props.prediction.payouts
      )
    );
  }

  if (props.prediction.status === PredictionLifeCycle.RETIRED) {
    fields.push(embedFields.date(retired, "Retired"));
    if (props.prediction.driver === "date") {
      fields.push(embedFields.date(due, "Original Due Date"));
    } else {
      fields.push(embedFields.date(check, "Original Check Date"));
    }
    fields.push(
      embedFields.season(
        props.prediction.season_id,
        props.prediction.season_applicable
      )
    );
  }

  embed.setFields(fields);

  return [embed];
};

export const generateStandardViewComponents = (
  prediction: NDB2API.Entities.Predictions.Prediction
): BaseMessageOptions["components"] => {
  const actionRow1 = new ActionRowBuilder<ButtonBuilder>();

  if (
    prediction.status === PredictionLifeCycle.OPEN ||
    prediction.status === PredictionLifeCycle.CHECKING
  ) {
    actionRow1.addComponents(
      getEndorseButton(prediction.id),
      getUndorseButton(prediction.id)
    );
  }

  if (prediction.status === PredictionLifeCycle.CLOSED) {
    actionRow1.addComponents(
      getAffirmButton(prediction.id),
      getNegateButton(prediction.id)
    );
  }

  if (
    prediction.status === PredictionLifeCycle.SUCCESSFUL ||
    prediction.status === PredictionLifeCycle.FAILED
  ) {
    actionRow1.addComponents(
      getDetailsButton(prediction.id, "Season", "Results - Season"),
      getDetailsButton(prediction.id, "Alltime", "Results - All-time")
    );
  } else {
    actionRow1.addComponents(
      getDetailsButton(prediction.id, "Season", "Details")
    );
  }

  actionRow1.addComponents(getWebButton(prediction.id));

  return [actionRow1];
};
