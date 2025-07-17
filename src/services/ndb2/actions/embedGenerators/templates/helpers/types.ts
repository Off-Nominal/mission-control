import { Client, GuildMember } from "discord.js";
import { NDB2API as NDB2API_V1 } from "../../../../../../providers/ndb2-client";
import * as NDB2API from "@offnominal/ndb2-api-types";

export namespace NDB2EmbedTemplate {
  export enum View {
    STANDARD = "STANDARD",
    RETIREMENT = "RETIREMENT",
    TRIGGER = "TRIGGER",
    SNOOZE_CHECK = "SNOOZE_CHECK",
    JUDGEMENT = "JUDGEMENT",
    SEASON_START = "SEASON_START",
    SEASON_END = "SEASON_END",
    LEADERBOARD = "LEADERBOARD",
    LIST = "LIST",
    DETAILS = "DETAILS",
    SCORES = "SCORES",
    PREDICTION_EDIT = "PREDICTION_EDIT",
  }

  export type Context = {
    messageId: string;
    channelId: string;
  };

  export namespace Args {
    export type Standard = {
      prediction: NDB2API.Entities.Predictions.Prediction;
      displayName?: string;
      avatarUrl?: string;
      context?: Context;
    };

    export type Retirement = {
      prediction: NDB2API_V1.EnhancedPrediction;
      predictor: GuildMember;
      context?: Context;
    };

    export type Trigger = {
      prediction: NDB2API_V1.EnhancedPrediction;
      predictor: GuildMember;
      client: Client;
      triggerer?: GuildMember;
      context?: Context;
    };

    export type SnoozeCheck = {
      prediction: NDB2API_V1.EnhancedPrediction;
      client: Client;
      context?: Context;
    };

    export type Judgement = {
      prediction: NDB2API_V1.EnhancedPrediction;
      client: Client;
      context?: Context;
    };

    export type SeasonStart = {
      season: NDB2API_V1.Season;
    };

    export type SeasonEnd = {
      results: NDB2API_V1.SeasonResults;
      predictionsLeaderboard: NDB2API_V1.PredictionsLeader[];
      betsLeaderboard: NDB2API_V1.BetsLeader[];
      pointsLeaderboard: NDB2API_V1.PointsLeader[];
    };

    export type PredictionEdit = {
      prediction: NDB2API_V1.EnhancedPrediction;
      predictor: GuildMember;
      edited_fields: {
        check_date: {
          old: string;
          new: string;
        };
      };
    };

    export type Leaderboard = (
      | {
          type: "points";
          leaders: NDB2API_V1.PointsLeader[];
        }
      | {
          type: "predictions";
          leaders: NDB2API_V1.PredictionsLeader[];
        }
      | {
          type: "bets";
          leaders: NDB2API_V1.BetsLeader[];
        }
    ) & { seasonIdentifier?: "current" | "last" };

    export type List = {
      type:
        | "recent"
        | "upcoming"
        | "upcoming-mine"
        | "upcoming-no-bet"
        | "search";
      predictions: NDB2API_V1.ShortEnhancedPrediction[];
      options?: {
        keyword?: string;
      };
    };

    export type Details = {
      prediction: NDB2API.Entities.Predictions.Prediction;
      season: boolean;
    };

    export type Scores = {
      scores: NDB2API_V1.Scores;
      member: GuildMember;
      seasonIdentifier?: "current" | "last";
    };
  }
}

export type EmbedTemplateArgs =
  | [NDB2EmbedTemplate.View.STANDARD, NDB2EmbedTemplate.Args.Standard]
  | [NDB2EmbedTemplate.View.RETIREMENT, NDB2EmbedTemplate.Args.Retirement]
  | [NDB2EmbedTemplate.View.TRIGGER, NDB2EmbedTemplate.Args.Trigger]
  | [NDB2EmbedTemplate.View.SNOOZE_CHECK, NDB2EmbedTemplate.Args.SnoozeCheck]
  | [NDB2EmbedTemplate.View.JUDGEMENT, NDB2EmbedTemplate.Args.Judgement]
  | [NDB2EmbedTemplate.View.SEASON_START, NDB2EmbedTemplate.Args.SeasonStart]
  | [NDB2EmbedTemplate.View.SEASON_END, NDB2EmbedTemplate.Args.SeasonEnd]
  | [NDB2EmbedTemplate.View.LEADERBOARD, NDB2EmbedTemplate.Args.Leaderboard]
  | [NDB2EmbedTemplate.View.LIST, NDB2EmbedTemplate.Args.List]
  | [NDB2EmbedTemplate.View.DETAILS, NDB2EmbedTemplate.Args.Details]
  | [NDB2EmbedTemplate.View.SCORES, NDB2EmbedTemplate.Args.Scores]
  | [
      NDB2EmbedTemplate.View.PREDICTION_EDIT,
      NDB2EmbedTemplate.Args.PredictionEdit
    ];
