import {
  ChannelType,
  Client,
  EmbedBuilder,
  TimestampStyles,
  time,
} from "discord.js";
import bootLogger from "../../logger";
import { LogInitiator, LogStatus, Logger } from "../../logger/Logger";
import { Providers } from "../../providers";
import {
  GithubUpdateEmbedData,
  SiteListener,
  SiteListenerEvents,
} from "./SiteListener";

async function sendStarshipSiteUpdate(
  client: Client,
  update: GithubUpdateEmbedData,
  targetChannel: string,
  path: string
) {
  const embed = new EmbedBuilder();

  embed
    .setColor("#3e7493")
    .setTitle(`Change detected on Starship's Website`)
    .setDescription(
      `Change occured at ${time(update.date, TimestampStyles.LongDateTime)}.`
    )
    .addFields([
      {
        name: "View",
        value: `[Starship Site](${update.url})`,
        inline: true,
      },
      {
        name: "Compare",
        value: `[Differences](${update.diffUrl})`,
        inline: true,
      },
      {
        name: "History",
        value: `[Recent Changes](https://github.com/${path}/log.json)`,
        inline: true,
      },
    ])
    .setTimestamp();

  try {
    const channel = await client.channels.fetch(targetChannel);
    if (channel === null || channel.type !== ChannelType.GuildText) return;
    await channel.send({ embeds: [embed] });
    console.log(`Discord successfully notified of changes to ${update.url}`);
  } catch (err) {
    console.error(err);
  }
}

export default function StarshipSiteListener({
  githubAgent,
  helperBot,
  mcconfig,
}: Providers) {
  const starship = new SiteListener(
    "https://www.spacex.com/vehicles/starship/",
    githubAgent,
    {
      interval: 30,
      cooldown: 600,
    }
  );

  starship.on(SiteListenerEvents.READY, () => {
    bootLogger.addLog(
      LogStatus.SUCCESS,
      `Site listener monitoring Starship Website`
    );
    bootLogger.logItemSuccess("starshipSiteChecker");
  });

  starship.on(SiteListenerEvents.UPDATE, (update) =>
    sendStarshipSiteUpdate(
      helperBot,
      update,
      mcconfig.discord.channels.boca_chica,
      `${mcconfig.siteTracker.starship.owner}/${mcconfig.siteTracker.starship.repo}/blob/${mcconfig.siteTracker.starship.branch}`
    )
  );

  starship.on(SiteListenerEvents.ERROR, (err) => {
    const logger = new Logger(
      "Starship Site Check",
      LogInitiator.SERVER,
      "siteChecker"
    );
    logger.addLog(LogStatus.FAILURE, err);
    logger.sendLog(helperBot);
  });

  starship.initialize();
}
