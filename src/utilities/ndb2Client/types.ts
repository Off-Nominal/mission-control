// Basic Schema Records

export interface Record {
  id: number;
}

export interface User extends Record {
  discord_id: string;
}

export interface Bet extends Record {
  better_id: number;
  prediction_id: number;
  endorsed: boolean;
  created: Date;
}

export interface Prediction extends Record {
  predictor_id: number;
  text: string;
  created: Date;
  due: Date;
  closed: Date;
  judged: Date;
  closer_id: number;
  succesful: boolean;
  message_id: string;
  channel_id: string;
}

export interface Vote extends Record {
  voter_id: number;
  prediction_id: number;
  affirmative: boolean;
}

export interface Season extends Record {
  name: string;
  start: Date;
  end: Date;
}

// View Records

export interface EnhancedPrediction
  extends Omit<Prediction, "predictor_id" | "closer_id" | "successful"> {
  predictor_id: number;
  predictor_discord_id: string;
  closer_id: number;
  successful: boolean;
  votes: Omit<Vote, "prediction_id">[];
  bets: Omit<Bet, "prediction_id">[];
  odds: number;
}

export interface EnhancedSeason extends Season {
  status: SeasonStatus;
}

// API Records

export interface APISeason extends Record {
  name: string;
  start: string;
  end: string;
}

export interface APIEnhancedSeason extends APISeason {
  status: SeasonStatus;
}

export enum SeasonStatus {
  FUTURE = "future",
  NEXT = "next",
  CURRENT = "current",
  LAST = "last",
  PAST = "past",
}

export type APIUser = User;

export interface APIScore {
  user_id: number;
  user_discord_id: string;
  season_id: number;
  season: Omit<APIEnhancedSeason, "id">;
  points: number;
  predictions: {
    successful: number;
    unsuccessful: number;
    pending: number;
  };
  endorsements: {
    successful: number;
    unsuccessful: number;
    pending: number;
  };
  undorsements: {
    successful: number;
    unsuccessful: number;
    pending: number;
  };
}

export interface APIEnhancedUser extends APIUser {
  predictions: Omit<APIPrediction, "predictor_id">[];
  bets: Omit<APIBet, "better_id">[];
  scores: Omit<APIScore, "user_id" | "user_discord_id">[];
}

export interface APIBet extends Omit<Bet, "created"> {
  created: string;
}

export interface APIPrediction
  extends Omit<Prediction, "created" | "closed" | "due" | "judged"> {
  created: string;
  closed: string;
  due: string;
  judged: string;
}

export type APIVote = Vote;

// API View Records

export interface APIEnhancedPrediction
  extends Omit<APIPrediction, "predictor_id" | "closer_id" | "successful"> {
  predictor_id: number;
  predictor_discord_id: string;
  closer_id: number;
  successful: boolean;
  votes: Omit<APIVote, "prediction_id">[];
  bets: Omit<APIBet, "prediction_id">[];
  odds: number;
}

// API REsponse Records

export interface ClosePredictionResponse extends Record {
  channel_id: string;
}
