import { EmbedBuilder } from "@discordjs/builders";
import {
  ActionRowBuilder,
  APIEmbedField,
  BaseMessageOptions,
  ButtonBuilder,
  userMention,
} from "discord.js";
import { NDB2EmbedTemplate } from "./helpers/types";
import { getAuthor, getThumbnail } from "./helpers/helpers";
import embedFields from "./helpers/fields";
import {
  getAffirmButton,
  getDetailsButton,
  getNegateButton,
  getWebButton,
} from "./helpers/buttons";

export const generateTriggerNoticeEmbed = (
  props: NDB2EmbedTemplate.Args.Trigger
): BaseMessageOptions["embeds"] => {
  const created = new Date(props.prediction.created_date);
  const due = new Date(props.prediction.due_date || 0);
  const triggered = new Date(props.prediction.triggered_date || 0);
  const closed = new Date(props.prediction.closed_date || 0);

  const endorsements = props.prediction.bets.filter(
    (bet) => bet.endorsed && bet.valid
  );
  const undorsements = props.prediction.bets.filter(
    (bet) => !bet.endorsed && bet.valid
  );

  const yesVotes = props.prediction.votes.filter((vote) => vote.vote);
  const noVotes = props.prediction.votes.filter((vote) => !vote.vote);

  const embed = new EmbedBuilder({
    author: getAuthor(props.client, props.triggerer),
    thumbnail: {
      url: getThumbnail(props.prediction.status),
    },
    title: "Trigger Notice",
    description:
      `Prediction #${props.prediction.id} by ${userMention(
        props.prediction.predictor.discord_id
      )} has been triggered ${
        props.triggerer?.id ? "manually" : "automatically"
      } by ${
        props.triggerer?.id ? `${userMention(props.triggerer.id)}` : "NDB2"
      }.` + `\n \u200B`,
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

  props.triggerer && fields.push(embedFields.date(due, "Original Due Date"));

  fields.push(embedFields.date(triggered, "Triggered Date"));
  fields.push(embedFields.date(closed, "Effective Close Date"));
  fields.push(
    embedFields.shortBets(
      endorsements.length,
      undorsements.length,
      props.prediction.payouts
    )
  );
  fields.push(embedFields.votingNotice());
  fields.push(embedFields.shortVotes(yesVotes.length, noVotes.length));

  embed.setFields(fields);

  return [embed];
};

export const generateTriggerNoticeComponents = (
  predictionId: number | string
): BaseMessageOptions["components"] => {
  const actionRow = new ActionRowBuilder<ButtonBuilder>();

  actionRow.addComponents(
    getAffirmButton(predictionId),
    getNegateButton(predictionId),
    getDetailsButton(predictionId, "Season", "Details"),
    getWebButton(predictionId)
  );

  return [actionRow];
};
