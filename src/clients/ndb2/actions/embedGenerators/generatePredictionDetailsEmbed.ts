import { APIEmbedField, EmbedBuilder, italic, userMention } from "discord.js";
import {
  NDB2API,
  PredictionLifeCycle,
} from "../../../../utilities/ndb2Client/types";
import embedFields from "./fields";
import { getPredictedPrefix } from "./helpers";

export const generatePredictionDetailsEmbed = (
  prediction: NDB2API.EnhancedPrediction,
  season: boolean
) => {
  const endorsements = prediction.bets.filter(
    (bet) => bet.endorsed && bet.valid
  );
  const undorsements = prediction.bets.filter(
    (bet) => !bet.endorsed && bet.valid
  );
  const invalidBets = prediction.bets.filter((bet) => !bet.valid);

  const yesVotes = prediction.votes.filter((vote) => vote.vote);
  const noVotes = prediction.votes.filter((vote) => !vote.vote);

  const embed = new EmbedBuilder({
    title: "Detailed View - Status: " + prediction.status.toUpperCase(),
    description:
      userMention(prediction.predictor.discord_id) +
      " " +
      getPredictedPrefix(prediction.status) +
      " " +
      italic(prediction.text) +
      `\n \u200B`,
  });

  const fields: APIEmbedField[] = [];

  if (prediction.status === PredictionLifeCycle.OPEN) {
    fields.push(
      embedFields.riskAssessment(
        prediction.bets.length,
        prediction.payouts.endorse
      )
    );
    fields.push(embedFields.longOdds(prediction.payouts));
    embedFields
      .longBets(endorsements, "endorsements")
      .forEach((bf) => fields.push(bf));
    embedFields
      .longBets(undorsements, "undorsements")
      .forEach((bf) => fields.push(bf));
    fields.push(embedFields.accuracyDisclaimer());
  }

  if (prediction.status === PredictionLifeCycle.CLOSED) {
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

  if (prediction.status === PredictionLifeCycle.RETIRED) {
    embedFields
      .longBets(endorsements, "endorsements")
      .forEach((bf) => fields.push(bf));
    embedFields
      .longBets(undorsements, "undorsements")
      .forEach((bf) => fields.push(bf));
  }

  if (
    prediction.status === PredictionLifeCycle.SUCCESSFUL ||
    prediction.status === PredictionLifeCycle.FAILED
  ) {
    fields.push(
      embedFields.season(prediction.season_id, prediction.season_applicable)
    );

    fields.push(
      embedFields.payoutsText(prediction.status, prediction.payouts, season)
    );
    embedFields
      .longPayouts(prediction.status, "endorsements", endorsements, season)
      .forEach((ef) => fields.push(ef));
    embedFields
      .longPayouts(prediction.status, "undorsements", undorsements, season)
      .forEach((ef) => fields.push(ef));
    embedFields
      .longPayouts(prediction.status, "invalid", invalidBets, season)
      .forEach((ef) => fields.push(ef));

    embedFields.longVotes(yesVotes, "yes").forEach((yv) => fields.push(yv));
    embedFields.longVotes(noVotes, "no").forEach((nv) => fields.push(nv));
  }

  embed.setFields(fields);

  return embed;
};
