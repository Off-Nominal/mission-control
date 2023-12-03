import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  GuildScheduledEvent,
  GuildScheduledEventCreateOptions,
  GuildScheduledEventEntityType,
  GuildScheduledEventPrivacyLevel,
  GuildScheduledEventStatus,
  Message,
  MessageCreateOptions,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ThreadMember,
  userMention,
} from "discord.js";
import { Providers } from "../../providers";
import createDiscordEvent from "../../actions/create-discord-event";
import { add } from "date-fns";
import { LogInitiator, LogStatus, Logger } from "../../logger/Logger";

export default function CreateEventFromThread({
  eventsBot,
  mcconfig,
  cache,
}: Providers) {
  eventsBot.on("threadCreate", async (thread) => {
    // ignore everything not in livechat
    if (thread.parent.id !== mcconfig.discord.channels.livechat) {
      return;
    }

    const logger = new Logger(
      "CreateEventFromForumPost",
      LogInitiator.DISCORD,
      "threadCreate Event"
    );

    let owner: ThreadMember;
    try {
      owner = await thread.fetchOwner();
      logger.addLog(
        LogStatus.SUCCESS,
        `Thread owner resolved: ${owner.guildMember.displayName}`
      );
    } catch (err) {
      console.error(err);
      return;
    }

    // ignore bot posts
    if (owner.user.bot) {
      logger.addLog(LogStatus.SUCCESS, `Owner is a bot, ignoring...`);
      logger.sendLog(eventsBot);
      return;
    }

    const components = [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("createEventFromForumPost")
          .setLabel("Make an Event for this!")
          .setStyle(ButtonStyle.Primary)
      ),
    ];

    const messageOptions: MessageCreateOptions = {
      content: `Hey ${userMention(
        owner.id
      )}, thanks for starting an event post! If you want me to create and start a Discord Event for this, smash that button below. A discord event can notify others that something is happening if they are subscribed to notifications.\n\n**Note:** Any event already in the Discord Events log will automatically have a post created for them 30 mins prior to start. If you've just now made a duplicate, please close it to avoid spreading wideset panic and confusion among the masses.`,
      components,
    };

    try {
      const message = await thread.send(messageOptions);
      logger.addLog(
        LogStatus.SUCCESS,
        `Send message to ask for event if necessary.`
      );
      cache.createEventFromThread[thread.id] = message;
      logger.addLog(LogStatus.INFO, `Added message to cache.`);
    } catch (err) {
      console.error(err);
    }

    setTimeout(async () => {
      if (cache.createEventFromThread[thread.id]) {
        try {
          await cache.createEventFromThread[thread.id].delete();
          delete cache.createEventFromThread[thread.id];
        } catch (err) {
          console.error(err);
        }
      }
    }, 1000 * 60 * 60 * 6); // 6 hours

    logger.sendLog(eventsBot);
  });

  // Handle Button Press
  eventsBot.on("interactionCreate", (interaction) => {
    if (!interaction.isButton()) {
      return;
    }

    if (interaction.customId !== "createEventFromForumPost") {
      return;
    }

    const modal = new ModalBuilder()
      .setCustomId("createEventFromForumPostModal")
      .setTitle("New Discord Event");

    const titleInput = new TextInputBuilder()
      .setCustomId("title")
      .setLabel("Event Name")
      .setPlaceholder("Press Conference, Moon Landing, etc")
      .setMaxLength(100)
      .setRequired(true)
      .setStyle(TextInputStyle.Short);

    const descriptionInput = new TextInputBuilder()
      .setCustomId("description")
      .setLabel("Event Description")
      .setPlaceholder("What's happening?")
      .setMaxLength(1000)
      .setRequired(true)
      .setStyle(TextInputStyle.Paragraph);

    const urlInput = new TextInputBuilder()
      .setCustomId("url")
      .setLabel("Event URL")
      .setPlaceholder("https://www.youtube.com/whatever")
      .setMaxLength(100)
      .setRequired(true)
      .setStyle(TextInputStyle.Short);

    const firstActionRow =
      new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput);

    const secondActionRow =
      new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput);

    const thirdActionRow =
      new ActionRowBuilder<TextInputBuilder>().addComponents(urlInput);

    modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

    return interaction.showModal(modal);
  });

  // Handle Modal Submission
  eventsBot.on("interactionCreate", async (interaction) => {
    if (!interaction.isModalSubmit()) {
      return;
    }

    if (interaction.customId !== "createEventFromForumPostModal") {
      return;
    }

    const logger = new Logger(
      "Create Event From Forum Post",
      LogInitiator.DISCORD,
      "Modal Submission"
    );

    const { fields } = interaction;

    const title = fields.getTextInputValue("title");
    const description = fields.getTextInputValue("description");
    const url = fields.getTextInputValue("url");

    if (!title || !description || !url) {
      interaction.reply({
        content: "Some required fields are missing, please try again.",
      });
      logger.addLog(LogStatus.FAILURE, "Missing required fields");
      logger.sendLog(interaction.client);
      return;
    }

    const options: GuildScheduledEventCreateOptions = {
      name: title,
      description,
      entityMetadata: {
        location: url,
      },
      scheduledStartTime: add(new Date(), { minutes: 1 }),
      scheduledEndTime: add(new Date(), { minutes: 90 }),
      privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
      entityType: GuildScheduledEventEntityType.External,
    };

    let event: GuildScheduledEvent;

    try {
      event = await createDiscordEvent(options, eventsBot);
    } catch (err) {
      interaction.reply({
        content: "There was an error creating the event, please let Jake know!",
      });
      logger.addLog(LogStatus.FAILURE, "Event Creation Failure");
      logger.sendLog(interaction.client);
      console.error(err);
    }

    try {
      await event.setStatus(GuildScheduledEventStatus.Active);
    } catch (err) {
      interaction.reply({
        content:
          "The event was created, but I couldn't automatically start it, please let Jake know!",
      });
      logger.addLog(LogStatus.FAILURE, "Event Start Failure");
      logger.sendLog(interaction.client);
      console.error(err);
    }

    interaction.reply({
      content: "Alright, I've created an event for this and started it. Enjoy!",
    });

    // delete message in cache
    try {
      if (cache.createEventFromThread[interaction.channelId]) {
        await cache.createEventFromThread[interaction.channelId]?.delete();
        delete cache.createEventFromThread[interaction.channelId];
      }
    } catch (err) {
      logger.addLog(LogStatus.FAILURE, "Could not delete message with button");
      logger.sendLog(interaction.client);
      console.error(err);
    }

    logger.sendLog(interaction.client);
  });
}
