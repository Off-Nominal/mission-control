import {
  ActionRowBuilder,
  BaseMessageOptions,
  bold,
  ButtonBuilder,
  EmbedBuilder,
} from "discord.js";
import { getLeaderboardsButton } from "./helpers/buttons";
import { NDB2EmbedTemplate } from "./helpers/types";
import embedFields from "./helpers/fields";

export const generateSeasonStartEmbed = (
  props: NDB2EmbedTemplate.Args.SeasonStart
): BaseMessageOptions["embeds"] => {
  const embed = new EmbedBuilder({
    title: "New Season: " + props.season.name,
    thumbnail: {
      url: "https://res.cloudinary.com/dj5enq03a/image/upload/v1685318171/Discord%20Assets/announcement_wqapxb-Square_cmy87b.png",
    },
    description: `A new season called ${bold(
      props.season.name
    )} begins now with Nostradambot2! Happy betting, Anomalies!`,
    fields: [
      embedFields.date(new Date(props.season.start), "Season Start Date/Time", {
        showTime: true,
      }),
      embedFields.date(new Date(props.season.end), "Season End Date/Time", {
        showTime: true,
      }),
      embedFields.wagerCap(props.season.wager_cap),
    ],
  });

  return [embed];
};

export const generateSeasonStartComponents =
  (): BaseMessageOptions["components"] => {
    const actionRow = new ActionRowBuilder<ButtonBuilder>();
    actionRow.addComponents(getLeaderboardsButton());

    return [actionRow];
  };
