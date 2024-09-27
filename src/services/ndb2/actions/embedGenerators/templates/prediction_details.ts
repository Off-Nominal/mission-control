import {
  ActionRowBuilder,
  APIEmbedField,
  BaseMessageOptions,
  ButtonBuilder,
  EmbedBuilder,
  italic,
  userMention,
} from "discord.js";
import embedFields from "./helpers/fields";
import { getPredictedPrefix } from "./helpers/helpers";
import {
  NDB2API,
  PredictionLifeCycle,
} from "../../../../../providers/ndb2-client";
import { getWebButton } from "./helpers/buttons";
import { NDB2EmbedTemplate } from "./helpers/types";

const driver = (driver: NDB2API.PredictionDriver) => {
  return driver === "date" ? "(Date-driven)" : "(Event-driven)";
};

export const generatePredictionDetailsEmbed = (
  props: NDB2EmbedTemplate.Args.Details
): BaseMessageOptions["embeds"] => {
  const endorsements = props.prediction.bets.filter(
    (bet) => bet.endorsed && bet.valid
  );
  const undorsements = props.prediction.bets.filter(
    (bet) => !bet.endorsed && bet.valid
  );
  const invalidBets = props.prediction.bets.filter((bet) => !bet.valid);

  const yesVotes = props.prediction.votes.filter((vote) => vote.vote);
  const noVotes = props.prediction.votes.filter((vote) => !vote.vote);

  const embed = new EmbedBuilder({
    title: [
      "Detailed View - Status:",
      props.prediction.status.toUpperCase(),
      driver(props.prediction.driver),
    ].join(" "),
    description: [
      userMention(props.prediction.predictor.discord_id),
      getPredictedPrefix(props.prediction.status),
      italic(props.prediction.text),
      `\n \u200B`,
    ].join(" "),
  });

  const fields: APIEmbedField[] = [];

  if (
    props.prediction.status === PredictionLifeCycle.OPEN ||
    props.prediction.status === PredictionLifeCycle.CHECKING
  ) {
    fields.push(
      embedFields.riskAssessment(
        props.prediction.bets.length,
        props.prediction.payouts.endorse
      )
    );
    fields.push(embedFields.longOdds(props.prediction.payouts));
    embedFields
      .longBets(endorsements, "endorsements")
      .forEach((bf) => fields.push(bf));
    embedFields
      .longBets(undorsements, "undorsements")
      .forEach((bf) => fields.push(bf));
    fields.push(embedFields.accuracyDisclaimer());
  }

  if (props.prediction.status === PredictionLifeCycle.CLOSED) {
    embedFields
      .longBets(endorsements, "endorsements")
      .forEach((bf) => fields.push(bf));
    embedFields
      .longBets(undorsements, "undorsements")
      .forEach((bf) => fields.push(bf));
    embedFields
      .longBets(invalidBets, "invalid")
      .forEach((bf) => fields.push(bf));

    embedFields.longVotes(yesVotes, "yes").forEach((yv) => fields.push(yv));
    embedFields.longVotes(noVotes, "no").forEach((nv) => fields.push(nv));
    fields.push(embedFields.accuracyDisclaimer());
  }

  if (props.prediction.status === PredictionLifeCycle.RETIRED) {
    embedFields
      .longBets(endorsements, "endorsements")
      .forEach((bf) => fields.push(bf));
    embedFields
      .longBets(undorsements, "undorsements")
      .forEach((bf) => fields.push(bf));
  }

  if (
    props.prediction.status === PredictionLifeCycle.SUCCESSFUL ||
    props.prediction.status === PredictionLifeCycle.FAILED
  ) {
    fields.push(
      embedFields.season(
        props.prediction.season_id,
        props.prediction.season_applicable
      )
    );

    fields.push(
      embedFields.payoutsText(
        props.prediction.status,
        props.prediction.payouts,
        props.season
      )
    );
    embedFields
      .longPayouts(
        props.prediction.status,
        "endorsements",
        endorsements,
        props.season
      )
      .forEach((ef) => fields.push(ef));
    embedFields
      .longPayouts(
        props.prediction.status,
        "undorsements",
        undorsements,
        props.season
      )
      .forEach((ef) => fields.push(ef));
    embedFields
      .longPayouts(
        props.prediction.status,
        "invalid",
        invalidBets,
        props.season
      )
      .forEach((ef) => fields.push(ef));

    embedFields.longVotes(yesVotes, "yes").forEach((yv) => fields.push(yv));
    embedFields.longVotes(noVotes, "no").forEach((nv) => fields.push(nv));
  }

  embed.setFields(fields);

  return [embed];
};

export const generatePredictionDetailsComponents = (
  predictionId: string | number
) => {
  const actionRow = new ActionRowBuilder<ButtonBuilder>();
  actionRow.addComponents(getWebButton(predictionId));

  return [actionRow];
};
