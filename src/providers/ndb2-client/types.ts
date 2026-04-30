export namespace NDB2API {
  export type EnhancedPredictionBet = {
    id: number;
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
    id: number;
    vote: boolean;
    voted_date: string;
    voter: {
      id: string;
      discord_id: string;
    };
  };

  export type PredictionDriver = "event" | "date";

  export type Season = {
    id: number;
    name: string;
    start: string;
    end: string;
    wager_cap: number;
    closed: boolean;
  };

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
}
