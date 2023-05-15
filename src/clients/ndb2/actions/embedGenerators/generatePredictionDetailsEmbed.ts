import { APIEmbedField, EmbedBuilder } from "discord.js";
import {
  NDB2API,
  PredictionLifeCycle,
} from "../../../../utilities/ndb2Client/types";
import embedFields from "./fields";

export const generatePredictionDetailsEmbed = (
  prediction: NDB2API.EnhancedPrediction
) => {
  const endorsements = prediction.bets.filter((bet) => bet.endorsed);
  const undorsements = prediction.bets.filter((bet) => !bet.endorsed);

  const yesVotes = prediction.votes.filter((vote) => vote.vote);
  const noVotes = prediction.votes.filter((vote) => !vote.vote);

  const embed = new EmbedBuilder({
    title: "Detailed Prediction View",
    description: prediction.text + `\n \u200B`,
    thumbnail: {
      url: "https://res.cloudinary.com/dj5enq03a/image/upload/v1679231457/Discord%20Assets/5067685_evmy8z.png",
    },
  });

  const fields: APIEmbedField[] = [embedFields.longStatus(prediction.status)];

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

  if (prediction.status === PredictionLifeCycle.SUCCESSFUL) {
    fields.push(embedFields.payoutsText(prediction.status, prediction.payouts));
    embedFields
      .longPayouts(
        prediction.status,
        prediction.payouts,
        "endorsements",
        endorsements
      )
      .forEach((ef) => fields.push(ef));
    embedFields
      .longPayouts(
        prediction.status,
        prediction.payouts,
        "undorsements",
        undorsements
      )
      .forEach((ef) => fields.push(ef));
    embedFields.longVotes(yesVotes, "yes").forEach((yv) => fields.push(yv));
    embedFields.longVotes(noVotes, "no").forEach((nv) => fields.push(nv));
  }

  if (prediction.status === PredictionLifeCycle.FAILED) {
    fields.push(embedFields.payoutsText(prediction.status, prediction.payouts));
    embedFields
      .longPayouts(
        prediction.status,
        prediction.payouts,
        "endorsements",
        endorsements
      )
      .forEach((ef) => fields.push(ef));
    embedFields
      .longPayouts(
        prediction.status,
        prediction.payouts,
        "undorsements",
        undorsements
      )
      .forEach((ef) => fields.push(ef));
    embedFields.longVotes(yesVotes, "yes").forEach((yv) => fields.push(yv));
    embedFields.longVotes(noVotes, "no").forEach((nv) => fields.push(nv));
  }

  embed.setFields(fields);

  return embed;
};
