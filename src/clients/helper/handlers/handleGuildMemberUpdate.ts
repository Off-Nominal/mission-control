import {
  GuildMember,
  EmbedBuilder,
  ChannelType,
  Collection,
  Role,
  MessageCreateOptions,
} from "discord.js";
import {
  LogInitiator,
  Logger,
  LogStatus,
} from "../../../services/logger/Logger";
import mcconfig from "../../../mcconfig";

const roleLabels = {
  [mcconfig.discord.roles.anomaly]: "Discord Anomaly",
  [mcconfig.discord.roles.nfrs]: "Discord Never Fly Ride Share",
  [mcconfig.discord.roles.meco]: "Main Engine Cut Off Patron",
  [mcconfig.discord.roles.wemartians]: "WeMartians Patron",
  [mcconfig.discord.roles.youtube_anomaly]: "YouTube Anomaly",
};

export default async function handleGuildMemberUpdate(
  oldMember: GuildMember,
  newMember: GuildMember
) {
  const logger = new Logger(
    "New Role Add",
    LogInitiator.DISCORD,
    "guildMemberUpdate"
  );

  const oldRoles = oldMember.roles.cache;
  const newRoles = newMember.roles.cache;

  const addedRoles = new Collection<string, Role>();

  for (const [k, v] of newRoles) {
    if (!oldRoles.has(k)) {
      addedRoles.set(k, v);
    }
  }

  if (addedRoles.size < 1) {
    logger.addLog(LogStatus.INFO, "No new roles added - command ignored.");
    try {
      await logger.sendLog(newMember.client);
    } catch (err) {
      console.error(err);
    }
    return;
  }

  logger.addLog(
    LogStatus.INFO,
    `${addedRoles.size} new Roles added for user ${newMember.displayName}`
  );

  const isNewMember =
    !oldRoles.find(
      (_, roleId) =>
        roleId === mcconfig.discord.roles.premium ||
        roleId === mcconfig.discord.roles.youtube ||
        roleId === mcconfig.discord.roles.wemartians ||
        roleId === mcconfig.discord.roles.meco
    ) &&
    newRoles.find(
      (_, roleId) =>
        roleId === mcconfig.discord.roles.premium ||
        roleId === mcconfig.discord.roles.youtube ||
        roleId === mcconfig.discord.roles.wemartians ||
        roleId === mcconfig.discord.roles.meco
    );

  logger.addLog(
    LogStatus.INFO,
    `${newMember.displayName} is ${isNewMember ? "" : "not "}a new member.`
  );

  const embeds: EmbedBuilder[] = [];

  if (isNewMember) {
    const embed = new EmbedBuilder();

    embed
      .setColor("#3e7493")
      .setTitle(`Welcome to the Off-Nominal Discord, ${newMember.displayName}!`)
      .setThumbnail(newMember.user.displayAvatarURL())
      .setDescription(
        `Thanks for subscribing! Enjoy the flood of welcomes you are about to receive!`
      )
      .addFields(
        { name: "\u200B", value: "We have two core rules:" },
        {
          name: "1. Don't be mean",
          value: "Teasing is ok, discrimination isn't.",
          inline: true,
        },
        {
          name: "2. There are no dumb questions",
          value: "This community values learning and debate.",
          inline: true,
        },
        {
          name: "\u200B",
          value: `You can learn more about the rules as well as some of the bots available to help you by checking out our Welcome Guide in <#782993058866266132>.`,
        }
      );

    embeds.push(embed);
    logger.addLog(LogStatus.SUCCESS, "New member Embed added!");
  } else {
    const embed = new EmbedBuilder();

    embed
      .setThumbnail(newMember.user.displayAvatarURL())
      .setDescription("Thanks for supporting this community ❤️");

    for (const [k, v] of addedRoles) {
      if (v.id === mcconfig.discord.roles.anomaly) {
        embed
          .setColor("#C0C0C0")
          .setTitle(
            `🎉 ${newMember.displayName} has subscribed as a ${roleLabels[k]}!`
          );
        embeds.push(embed);
        logger.addLog(
          LogStatus.SUCCESS,
          "New pledge (Discord Anomaly) Embed added!"
        );
      }
      if (v.id === mcconfig.discord.roles.nfrs) {
        embed
          .setColor("#FFD700")
          .setTitle(
            `🎉 ${newMember.displayName} has subscribed as a ${roleLabels[k]}!`
          );
        embeds.push(embed);
        logger.addLog(
          LogStatus.SUCCESS,
          "New pledge (Discord #NeverFlyRideShare) Embed added!"
        );
      }
      if (v.id === mcconfig.discord.roles.meco) {
        embed
          .setColor("#66a3c6")
          .setTitle(
            `🎉 ${newMember.displayName} has subscribed as a ${roleLabels[k]}!`
          );
        embeds.push(embed);
        logger.addLog(
          LogStatus.SUCCESS,
          "New pledge (MECO Patron) Embed added!"
        );
      }
      if (v.id === mcconfig.discord.roles.wemartians) {
        embed
          .setColor("#d15d27")
          .setTitle(
            `🎉 ${newMember.displayName} has subscribed as a ${roleLabels[k]}!`
          );
        embeds.push(embed);
        logger.addLog(
          LogStatus.SUCCESS,
          "New pledge (WeMartians Patron) Embed added!"
        );
      }
      if (v.id === mcconfig.discord.roles.youtube_anomaly) {
        embed
          .setColor("#FF0000")
          .setTitle(
            `🎉 ${newMember.displayName} has subscribed as a ${roleLabels[k]}!`
          );
        embeds.push(embed);
        logger.addLog(
          LogStatus.SUCCESS,
          "New pledge (YouTube Anomaly) Embed added!"
        );
      }
    }
  }

  try {
    const channel = await newMember.client.channels.fetch(
      mcconfig.discord.channels.general
    );
    if (channel.type !== ChannelType.GuildText) return;

    const message: MessageCreateOptions = {
      embeds,
    };

    if (isNewMember) {
      message.content = `Attention <@${newMember.user.id}>!`;
    }

    await channel.send(message);
    logger.addLog(LogStatus.SUCCESS, "New Role Update Complete!");
    logger.sendLog(newMember.client);
  } catch (err) {
    console.error(err);
  }
}
