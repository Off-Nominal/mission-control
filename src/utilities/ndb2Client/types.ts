export enum PredictionLifeCycle {
  OPEN = "open",
  RETIRED = "retired",
  CLOSED = "closed",
  SUCCESSFUL = "successful",
  FAILED = "failed",
}

export enum ErrorCode {
  SERVER_ERROR = 0,
  AUTHENTICATION_ERROR = 1,
  BAD_REQUEST = 2,
  MALFORMED_BODY_DATA = 3,
  MALFORMED_QUERY_PARAMS = 4,
}

export namespace NDB2API {
  export type GeneralResponse<T = null> = {
    success: boolean;
    errorCode?: ErrorCode;
    message: string | null;
    data: T;
  };

  export type EnhancedPredictionBet = {
    id: string;
    endorsed: boolean;
    date: string;
    wager: number;
    valid: boolean;
    payout: number;
    season_payout: number;
    better: {
      id: string;
      discord_id: string;
    };
  };

  export type EnhancedPredictionVote = {
    id: string;
    vote: boolean;
    voted_date: string;
    voter: {
      id: string;
      discord_id: string;
    };
  };

  export type EnhancedPrediction = {
    id: number;
    predictor: {
      id: string;
      discord_id: string;
    };
    text: string;
    season_id: number;
    season_applicable: boolean;
    created_date: string;
    due_date: string;
    closed_date: string | null;
    triggered_date: string | null;
    triggerer: {
      id: string;
      discord_id: string;
    } | null;
    judged_date: string | null;
    retired_date: string | null;
    status: PredictionLifeCycle;
    bets: EnhancedPredictionBet[];
    votes: EnhancedPredictionVote[];
    payouts: {
      endorse: number;
      undorse: number;
    };
  };

  export type ShortEnhancedPrediction = Omit<
    EnhancedPrediction,
    "bets" | "votes"
  >;

  export type Scores = {
    score: {
      points: number;
      rank: number;
    };
    predictions: {
      successful: number;
      failed: number;
      pending: number;
      retired: number;
      rank: number;
    };
    bets: {
      successful: number;
      failed: number;
      pending: number;
      retired: number;
      invalid: number;
      rank: number;
    };
    votes: {
      sycophantic: number;
      contrarian: number;
      pending: number;
    };
  };

  export interface Leader {
    id: string;
    discord_id: string;
    rank: number;
  }

  export interface PointsLeader extends Leader {
    points: number;
  }

  export interface BetsLeader extends Leader {
    bets: {
      successful: number;
      unsuccessful: number;
      total: number;
    };
  }

  export interface PredictionsLeader extends Leader {
    predictions: {
      successful: number;
      unsuccessful: number;
      total: number;
    };
  }

  export type Season = {
    id: number;
    name: string;
    start: string;
    end: string;
    wager_cap: number;
    closed: boolean;
  };

  export type AddPrediction = GeneralResponse<EnhancedPrediction>;

  export type AddBet = GeneralResponse<EnhancedPrediction>;

  export type GetPrediction = GeneralResponse<EnhancedPrediction>;

  export type TriggerPrediction = GeneralResponse<EnhancedPrediction>;

  export type RetirePrediction = GeneralResponse<EnhancedPrediction>;

  export type GetScores = GeneralResponse<Scores>;

  export type SearchPredictions = GeneralResponse<ShortEnhancedPrediction[]>;

  export type AddVote = GeneralResponse<EnhancedPrediction>;

  export type LeaderboardType = "points" | "predictions" | "bets";

  type GetLeaderboard<T> = GeneralResponse<{
    type: LeaderboardType;
    season?: Season;
    leaders: T[];
  }>;

  export type GetPointsLeaderboard = GetLeaderboard<PointsLeader>;
  export type GetBetsLeaderboard = GetLeaderboard<BetsLeader>;
  export type GetPredictionsLeaderboard = GetLeaderboard<PredictionsLeader>;

  export type SeasonResults = {
    season: {
      id: number;
      name: string;
      start: string;
      end: string;
      wager_cap: number;
    };
    predictions: {
      closed: number;
      successes: number;
      failures: number;
    };
    bets: {
      closed: number;
      successes: number;
      failures: number;
    };
    scores: {
      payouts: number;
      penalties: number;
    };
    largest_payout: {
      value: number;
      prediction_id: number;
      better: {
        id: string;
        discord_id: string;
      };
    };
    largest_penalty: {
      value: number;
      prediction_id: number;
      better: {
        id: string;
        discord_id: string;
      };
    };
  };

  export type GetSeasons = GeneralResponse<Season[]>;
}
