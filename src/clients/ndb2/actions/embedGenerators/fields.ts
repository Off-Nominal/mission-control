import { bold, time, TimestampStyles, userMention } from "discord.js";
import {
  NDB2API,
  PredictionLifeCycle,
} from "../../../../utilities/ndb2Client/types";

const USER_LIST_LIMIT = 30;

const embedFields = {
  date: (date: Date, title: string) => {
    return {
      name: title,
      value: `🗓️ ${time(date, TimestampStyles.LongDate)} (${time(
        date,
        TimestampStyles.RelativeTime
      )})`,
    };
  },
  triggeredDate: (date: Date, title: string, triggerer_id: string) => {
    return {
      name: title,
      value: `🗓️ ${time(date, TimestampStyles.LongDate)} (${time(
        date,
        TimestampStyles.RelativeTime
      )}) by ${userMention(triggerer_id)}`,
    };
  },
  shortBets: (
    eCount: number,
    uCount: number,
    payouts: { endorse: number; undorse: number }
  ) => {
    return {
      name: "Bets (Odds)",
      value: `
      ✅ ${eCount} (${payouts.endorse.toFixed(
        2
      )}) \u200B \u200B \u200B \u200B ❌ ${uCount} (${payouts.undorse.toFixed(
        2
      )})`,
    };
  },
  votingNotice: () => {
    return {
      name: "Voting",
      value:
        "Voting is now active. Click *Yes* or *No* based on whether you think this prediction came true or not.",
    };
  },
  shortVotes: (yesCount: number, noCount: number) => {
    return {
      name: "Votes",
      value: `👍 ${yesCount} \u200B \u200B \u200B \u200B 👎 ${noCount}`,
    };
  },
  longVotes: (votes: NDB2API.EnhancedPredictionVote[], type: "yes" | "no") => {
    const values = votes.map((e) => userMention(e.voter.discord_id));

    const fieldCount = Math.ceil(values.length / USER_LIST_LIMIT);

    const voteFields = [];

    const name = type === "yes" ? "👍 Yes Votes" : "👎 No Votes";

    for (let i = 0; i < fieldCount; i++) {
      const voteSlice = values.slice(i, i + USER_LIST_LIMIT);

      voteFields.push({
        name: `${name}${
          values.length > USER_LIST_LIMIT ? ` Part ${i + 1}` : ""
        }`,
        value: `${voteSlice.join("\n") || "None"}` + `\n \u200B`,
      });
    }

    return voteFields;
  },
  payoutsText: (
    status: PredictionLifeCycle,
    payouts: { endorse: number; undorse: number }
  ) => {
    const endorseVerb =
      status === PredictionLifeCycle.SUCCESSFUL ? "earn" : "lose";
    const undorseVerb = status === PredictionLifeCycle.FAILED ? "earn" : "lose";

    return {
      name: "Payouts",
      value: `As a ${status} prediction, endorsers will ${endorseVerb} points at a rate of ${payouts.endorse} and undorsers will ${undorseVerb} points at a rate of ${payouts.undorse}. Below are the bets and their final tallies.`,
    };
  },
  longPayouts: (
    status: PredictionLifeCycle,
    ratios: { endorse: number; undorse: number },
    endorsements: NDB2API.EnhancedPredictionBet[],
    undorsements: NDB2API.EnhancedPredictionBet[]
  ) => {
    let payouts: string[];

    if (status === PredictionLifeCycle.SUCCESSFUL) {
      const bets = [...endorsements, ...undorsements.reverse()];
      payouts = bets.map((b) => {
        const multiplier = b.endorsed ? ratios.endorse : ratios.undorse;
        const payout = Math.floor(b.wager * multiplier);
        return `${b.endorsed ? "✅" : "❌"} ${userMention(
          b.better.discord_id
        )} (${b.endorsed ? "+" : "-"}${payout})`;
      });
    } else {
      const bets = [...undorsements, ...endorsements.reverse()];
      payouts = bets.map((b) => {
        const multiplier = b.endorsed ? ratios.undorse : ratios.endorse;
        const payout = Math.floor(b.wager * multiplier);
        return `${!b.endorsed ? "✅" : "❌"} ${userMention(
          b.better.discord_id
        )} (${!b.endorsed ? "+" : "-"}${payout})`;
      });
    }

    const fieldCount = Math.ceil(payouts.length / USER_LIST_LIMIT);

    const payoutFields = [];

    for (let i = 0; i < fieldCount; i++) {
      const payoutsSlice = payouts.slice(i, i + USER_LIST_LIMIT);

      payoutFields.push({
        name: `Payouts and Penalties${
          payouts.length > USER_LIST_LIMIT ? ` Part ${i + 1}` : ""
        }`,
        value: `${payoutsSlice.join("\n")}`,
      });
    }

    return payoutFields;
  },
  shortStatus: (status: PredictionLifeCycle) => {
    let pStatus: string;

    if (status === PredictionLifeCycle.CLOSED) {
      pStatus = "VOTING";
    } else {
      pStatus = status.toUpperCase();
    }
    return {
      name: "Current Prediction Status",
      value: pStatus + `\n \u200B`,
    };
  },
  longStatus: (status: PredictionLifeCycle) => {
    let value: string;

    if (status === PredictionLifeCycle.OPEN) {
      value =
        bold(status.toUpperCase()) +
        ": Prediction is open and new bets can be placed.";
    }
    if (status === PredictionLifeCycle.CLOSED) {
      value =
        bold(status.toUpperCase()) +
        ": Prediction is closed and the community is currently voting on its outcome.";
    }
    if (status === PredictionLifeCycle.RETIRED) {
      value =
        bold(status.toUpperCase()) +
        ": Prediction was retired by its creator shortly after creation. Usually this means there was a mistake in the prediction.";
    }
    if (status === PredictionLifeCycle.SUCCESSFUL) {
      value =
        bold(status.toUpperCase()) +
        ": Prediction has been judged successful and points have been awarded or revoked.";
    }
    if (status === PredictionLifeCycle.FAILED) {
      value =
        bold(status.toUpperCase()) +
        ": Prediction has been judged failed and points have been awarded or revoked.";
    }

    return {
      name: "Current Prediction Status",
      value: value + `\n \u200B`,
    };
  },
  riskAssessment: (betCount: number, endorsePayout: number) => {
    let value: string;

    if (betCount < 4) {
      value = `There aren't enough bets to get a good picture on this prediction's risk level yet. NDB2 makes a determination once there are at least four bets, but there are only ${betCount} at this moment.`;
    }
    if (endorsePayout > 1) {
      value =
        "Endorsing this prediction is currently considered __risky__, while undorsing it is considered __safe__. Most people seem to think it will fail, so endorse at your own risk. Undorsement rewards will be lower.";
    } else {
      value =
        "Endorsing this prediction is currently considered __safe__, while undorsing it is considered __risky__. Most people seem to think it will pass, so endorsement rewards will be lower. Undorse at your own risk.";
    }
    return {
      name: "Risk Assessment",
      value,
    };
  },
  longOdds: (payouts: { endorse: number; undorse: number }) => {
    return {
      name: "Current Odds",
      value:
        `A succesful prediction would pay current endorsers at ${payouts.endorse} times their wager (days). Undorsers woud lose ${payouts.undorse} times their wager.\n\nA failed prediction would pay out current undorsers at ${payouts.undorse} their wager (days), and endorsers would lose ${payouts.endorse} times their wager.` +
        `\n \u200B`,
    };
  },
  longBets: (
    bets: NDB2API.EnhancedPredictionBet[],
    type: "undorsements" | "endorsements"
  ) => {
    const values = bets.map(
      (e) =>
        `${userMention(e.better.discord_id)} ${time(
          new Date(e.date),
          TimestampStyles.LongDate
        )} (${e.wager} points wagered)`
    );

    const fieldCount = Math.ceil(values.length / USER_LIST_LIMIT);

    const betFields = [];

    const name =
      type === "endorsements" ? "✅ Endorsements" : "❌ Undorsements";

    for (let i = 0; i < fieldCount; i++) {
      const betSlice = values.slice(i, i + USER_LIST_LIMIT);

      betFields.push({
        name: `${name}${
          values.length > USER_LIST_LIMIT ? ` Part ${i + 1}` : ""
        }`,
        value: `${betSlice.join("\n") || "None"}` + `\n \u200B`,
      });
    }

    return betFields;
  },
  accuracyDisclaimer: () => {
    return {
      name: "Notes",
      value:
        "The data in this detail reply is current at the time of click but could become out of date as different bets or votes are made. These kinds of replies (ephemeral replies, that only you can see) cannot be edited after the fact, so to ensure you are getting the most up to date info, click the Details button again to get a new reply as needed.",
    };
  },
};

export default embedFields;
