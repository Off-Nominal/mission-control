import {
  bold,
  messageLink,
  time,
  TimestampStyles,
  userMention,
} from "discord.js";
import {
  NDB2API,
  PredictionLifeCycle,
} from "../../../../utilities/ndb2Client/types";

const USER_LIST_LIMIT = 30;

const embedFields = {
  date: (
    date: Date,
    title: string,
    options: {
      context?: { channelId: string; messageId: string };
      showTime?: boolean;
    } = {}
  ) => {
    const baseMessage = `🗓️ ${time(
      date,
      options.showTime
        ? TimestampStyles.ShortDateTime
        : TimestampStyles.LongDate
    )} (${time(date, TimestampStyles.RelativeTime)})`;

    let value = baseMessage;

    if (options.context) {
      value =
        baseMessage +
        ` (context: ${messageLink(
          options.context.channelId,
          options.context.messageId
        )})`;
    }

    return {
      name: title,
      value,
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
  wagerCap: (wagerCap: number) => {
    return {
      name: "Wager Cap",
      value: `This season's wager cap is ${bold(
        wagerCap.toString() + " points"
      )}. This is the most amount of points that can be wagered for purposes of season-based scoring (all-time scoring is unaffected). Wagers are then modified by their respective endorsement and undorsement multipliers.`,
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
      const voteSlice = values.slice(
        i * USER_LIST_LIMIT,
        i * USER_LIST_LIMIT + USER_LIST_LIMIT
      );

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
    status: PredictionLifeCycle.SUCCESSFUL | PredictionLifeCycle.FAILED,
    payouts: { endorse: number; undorse: number },
    season: boolean
  ) => {
    const endorseVerb =
      status === PredictionLifeCycle.SUCCESSFUL ? "earn" : "lose";
    const undorseVerb = status === PredictionLifeCycle.FAILED ? "earn" : "lose";

    return {
      name: "Payouts",
      value: `As a ${status} prediction, endorsers will ${endorseVerb} points at a rate of ${
        payouts.endorse
      } and undorsers will ${undorseVerb} points at a rate of ${
        payouts.undorse
      }. These rates and payouts/penalties are based on the season in which the prediction closed. Below are the bets and their final ${
        season ? "season" : "all time"
      } payouts`,
    };
  },
  longPayouts: (
    status: PredictionLifeCycle.SUCCESSFUL | PredictionLifeCycle.FAILED,
    type: "endorsements" | "undorsements" | "invalid",
    bets: NDB2API.EnhancedPredictionBet[],
    season: boolean
  ) => {
    let payouts: string[];
    let listType: "invalid" | "payouts" | "penalties";

    let sign: string = "";
    let title: string;
    const sortedBets = [...bets];

    if (type === "invalid") {
      listType = "invalid";
      title = "🚫 Invalid Bets";
    } else if (
      (type === "endorsements" && status === PredictionLifeCycle.SUCCESSFUL) ||
      (type === "undorsements" && status === PredictionLifeCycle.FAILED)
    ) {
      listType = "payouts";
      sign = "+";
      title = "🏆 Payouts";
    } else {
      listType = "penalties";
      sortedBets.reverse();
      title = "☠️ Penalties";
    }

    payouts = sortedBets.map((b) => {
      const payout = season ? b.season_payout : b.payout;

      if (!payout) {
        return `(--) ${userMention(b.better.discord_id)}`;
      }

      return `(${sign}${payout.toString()}) `.concat(
        userMention(b.better.discord_id)
      );
    });

    const fieldCount = Math.ceil(payouts.length / USER_LIST_LIMIT);

    const payoutFields = [];

    for (let i = 0; i < fieldCount; i++) {
      const payoutsSlice = payouts.slice(
        i * USER_LIST_LIMIT,
        i * USER_LIST_LIMIT + USER_LIST_LIMIT
      );

      const note =
        type === "invalid"
          ? "A new effective close date rendered these bets invalid (they were made after the event predicted transpired)\n"
          : "";

      payoutFields.push({
        name: `${title}${
          payouts.length > USER_LIST_LIMIT ? ` Part ${i + 1}` : ""
        }`,
        value: `${note}${payoutsSlice.join("\n")}` + `\n \u200B`,
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
    type: "undorsements" | "endorsements" | "invalid"
  ) => {
    const betUserListLimit = USER_LIST_LIMIT / 3;

    const values = bets.map((e) => {
      const wagerNote =
        type === "invalid" ? "" : ` (${e.wager} points wagered)`;
      return `${userMention(e.better.discord_id)} ${time(
        new Date(e.date),
        TimestampStyles.LongDate
      )}${wagerNote}`;
    });

    const fieldCount = Math.ceil(values.length / betUserListLimit);

    const betFields = [];

    let name: string;

    if (type === "invalid") {
      name = "🚫 Invalid Bets";
    } else if (type === "endorsements") {
      name = "✅ Endorsements";
    } else {
      name = "❌ Undorsements";
    }

    for (let i = 0; i < fieldCount; i++) {
      const betSlice = values.slice(
        i * betUserListLimit,
        i * betUserListLimit + betUserListLimit
      );

      const note =
        type === "invalid"
          ? "A new effective close date rendered these bets invalid (they were made after the event predicted transpired)\n"
          : "";

      betFields.push({
        name: `${name}${
          values.length > betUserListLimit ? ` Part ${i + 1}` : ""
        }`,
        value: `${note}${betSlice.join("\n") || "None"}` + `\n \u200B`,
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
