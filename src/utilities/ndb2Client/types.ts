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
}

export interface Vote extends Record {
  voter_id: number;
  prediction_id: number;
  affirmative: boolean;
}

// View Records

export interface EnhancedPrediction
  extends Omit<Prediction, "predictor_id" | "closer_id" | "successful"> {
  predictor: User;
  closer: User;
  result: {
    successful: boolean;
    votes: Omit<Vote, "prediction_id">[];
  };
  bets: Omit<Bet, "prediction_id">[];
  odds: number;
}

// API Records

export type APIUser = User;

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
  predictor: APIUser;
  closer: APIUser;
  result: {
    successful: boolean;
    votes: Omit<APIVote, "prediction_id">[];
  };
  bets: Omit<APIBet, "prediction_id">[];
  odds: number;
}

// Response Records

export type AddPredictionResponse = {
  id: number;
  text: string;
  predictor_id: number;
  due: string;
};
