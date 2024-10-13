import { ButtonBuilder, ButtonStyle } from "discord.js";

export const getAffirmButton = (predictionId: string | number) => {
  return new ButtonBuilder()
    .setCustomId(`Affirm ${predictionId}`)
    .setLabel("Yes 👍")
    .setStyle(ButtonStyle.Success);
};

export const getNegateButton = (predictionId: string | number) => {
  return new ButtonBuilder()
    .setCustomId(`Negate ${predictionId}`)
    .setLabel("No 👎")
    .setStyle(ButtonStyle.Danger);
};

export const getSnoozeButton = (
  predictionId: string | number,
  snoozeCheckId: string | number,
  days,
  count: number,
  label: string
) => {
  const voteCount = count > 0 ? ` (${count})` : "";
  return new ButtonBuilder()
    .setCustomId(`Snooze ${predictionId} ${snoozeCheckId} ${days}`)
    .setLabel(`⏰ ${label} ${voteCount}`)
    .setStyle(ButtonStyle.Secondary);
};

export const getDetailsButton = (
  predictionId: string | number,
  type: "Season" | "Alltime",
  label: string
) => {
  return new ButtonBuilder()
    .setCustomId(`Details ${predictionId} ${type}`)
    .setLabel(label)
    .setStyle(ButtonStyle.Secondary);
};

export const getWebButton = (predictionId: string | number) => {
  return new ButtonBuilder()
    .setLabel("View on Web")
    .setURL("https://nostradambot.com/predictions/" + predictionId)
    .setStyle(ButtonStyle.Link);
};

export const getLeaderboardsButton = () => {
  return new ButtonBuilder()
    .setLabel("View Leaderboards on Web")
    .setURL("https://nostradambot.com/")
    .setStyle(ButtonStyle.Link);
};

export const getAdvancedSearchButton = () => {
  return new ButtonBuilder()
    .setLabel("Advanced Search on Web")
    .setURL("https://nostradambot.com/predictions")
    .setStyle(ButtonStyle.Link);
};

export const getEndorseButton = (predictionId: string | number) => {
  return new ButtonBuilder()
    .setCustomId(`Endorse ${predictionId}`)
    .setLabel("Endorse")
    .setStyle(ButtonStyle.Success);
};

export const getUndorseButton = (predictionId: string | number) => {
  return new ButtonBuilder()
    .setCustomId(`Undorse ${predictionId}`)
    .setLabel("Undorse")
    .setStyle(ButtonStyle.Danger);
};
