import { EmbedBuilder, bold } from "discord.js";
import { NDB2API } from "../../../../utilities/ndb2Client/types";
import embedFields from "./fields";

export const generateNewSeasonEmbed = (
  season: NDB2API.Season
): EmbedBuilder => {
  const embed = new EmbedBuilder({
    title: "New Season: " + season.name,
    thumbnail: {
      url: "https://res.cloudinary.com/dj5enq03a/image/upload/v1685318171/Discord%20Assets/announcement_wqapxb-Square_cmy87b.png",
    },
    description: `A new season called ${bold(
      season.name
    )} begins now with Nostradambot2! Happy betting, Anomalies!`,
    fields: [
      embedFields.date(new Date(season.start), "Season Start Date/Time", {
        showTime: true,
      }),
      embedFields.date(new Date(season.end), "Season End Date/Time", {
        showTime: true,
      }),
      embedFields.wagerCap(season.wager_cap),
    ],
  });

  return embed;
};
