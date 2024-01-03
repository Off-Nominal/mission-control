import { EmbedBuilder } from "discord.js";
import { PredictionLifeCycle } from "../../../../providers/ndb2-client";

const generatePredictionBasedNotificationEmbed = (
  type:
    | "ndb_new"
    | "ndb_prediction_closed"
    | "ndb_bet_closed"
    | "ndb_bet_retired"
    | "ndb_prediction_judged"
    | "ndb_bet_judged",
  text: string,
  messageLink: string,
  predictionId: number,
  status?: PredictionLifeCycle.SUCCESSFUL | PredictionLifeCycle.FAILED
) => {
  let title: string;
  let description: string;

  switch (type) {
    case "ndb_new":
      title = "New Prediction";
      description = `A new prediction has been created!`;
      break;
    case "ndb_prediction_closed":
      title = "Prediction Up For Vote";
      description = `A prediction you made has closed and is being voted on!`;
      break;
    case "ndb_bet_closed":
      title = "Prediction Up For Vote";
      description = `A prediction you bet on has closed and is being voted on!`;
      break;
    case "ndb_bet_retired":
      title = "Prediction Retired";
      description = `A prediction you bet on has been retired!`;
      break;
    case "ndb_prediction_judged":
      title =
        "Prediction " +
        (status === PredictionLifeCycle.SUCCESSFUL ? "Successful" : "Failed");
      description = `A prediction you made has been judged!`;
      break;
    case "ndb_bet_judged":
      title =
        "Prediction " +
        (status === PredictionLifeCycle.SUCCESSFUL ? "Successful" : "Failed");
      description = `A prediction you bet on has been judged!`;
      break;
  }

  return new EmbedBuilder({
    title,
    description,
    fields: [
      {
        name: "Prediction Text",
        value: text,
      },
      {
        name: "View Prediction",
        value: `[View on Discord](${messageLink}) or [View on Web](https://ndb.offnom.com/predictions/${predictionId})`,
      },
    ],
  });
};

const generateSeasonBasedNotificationEmbed = (
  name: string,
  messageLink: string,
  seasonId: number
) => {
  return new EmbedBuilder({
    title: `Season ${name} ended!`,
    description: "This NDB season has ended. Check in on the results!",
    fields: [
      {
        name: "View Season Result",
        value: `[View on Discord](${messageLink})`,
      },
      {
        name: "Browse Predictions for this Season",
        value: `[View on Web](https://ndb.offnom.com/predictions?status=failed&status=successful&sort_by=due_date-asc&season_id=${seasonId})`,
      },
    ],
  });
};

type NotificationEmbedProps =
  | {
      type:
        | "ndb_new"
        | "ndb_prediction_closed"
        | "ndb_bet_closed"
        | "ndb_bet_retired";
      text: string;
      messageLink: string;
      predictionId: number;
    }
  | {
      type: "ndb_prediction_judged" | "ndb_bet_judged";
      status: PredictionLifeCycle.SUCCESSFUL | PredictionLifeCycle.FAILED;
      text: string;
      messageLink: string;
      predictionId: number;
    }
  | {
      type: "ndb_season_end";
      name: string;
      messageLink: string;
      seasonId: number;
    };

export const generateNotificationEmbed = (
  options: NotificationEmbedProps
): EmbedBuilder => {
  switch (options.type) {
    case "ndb_new":
    case "ndb_prediction_closed":
    case "ndb_bet_closed":
    case "ndb_bet_retired":
      return generatePredictionBasedNotificationEmbed(
        options.type,
        options.text,
        options.messageLink,
        options.predictionId
      );
    case "ndb_prediction_judged":
    case "ndb_bet_judged":
      return generatePredictionBasedNotificationEmbed(
        options.type,
        options.text,
        options.messageLink,
        options.predictionId,
        options.status
      );
    case "ndb_season_end":
      return generateSeasonBasedNotificationEmbed(
        options.name,
        options.messageLink,
        options.seasonId
      );
  }
};
