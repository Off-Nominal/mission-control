import { add, sub } from "date-fns";
import {
  GuildScheduledEvent,
  GuildScheduledEventCreateOptions,
  GuildScheduledEventEditOptions,
  GuildScheduledEventEntityType,
  GuildScheduledEventPrivacyLevel,
  GuildScheduledEventStatus,
  time,
  TimestampStyles,
} from "discord.js";
import { Launch } from "../../../utilities/rocketLaunchLiveClient/types";

const generateDescription = (launch: Launch): string => {
  const windowOpen = new Date(launch.win_open);
  const infoString = `\n\nStream is set to begin 15 minutes before liftoff time of ${time(
    windowOpen,
    TimestampStyles.LongDateTime
  )}, in ${time(windowOpen, TimestampStyles.RelativeTime)}`;
  const idString = `\n\nrllId=[${launch.id.toString()}]\n\nData provided by RocketLaunch.live`;
  return launch.launch_description + infoString + idString;
};

const getStreamUrl = (launch: Launch) => {
  const streamMedia = launch.media.find(
    (media) => media.ldfeatured || media.featured
  );

  if (!streamMedia) {
    return "Unavailable";
  }

  return streamMedia.youtube_vidid
    ? `https://www.youtube.com/watch?v=${streamMedia.youtube_vidid}`
    : streamMedia.media_url;
};

const generateScheduledStartTime = (winOpen: Date): Date =>
  sub(winOpen, { minutes: 15 });

const generateScheduledEndTime = (winOpen: Date, winClose: string): Date =>
  winClose
    ? add(new Date(winClose), { minutes: 15 })
    : add(winOpen, { minutes: 60 });

export const generateEventCreateOptionsFromLaunch = (
  launch: Launch
): GuildScheduledEventCreateOptions => {
  const winOpen = new Date(launch.win_open);

  const options: GuildScheduledEventCreateOptions = {
    name: launch.name,
    scheduledStartTime: generateScheduledStartTime(winOpen),
    scheduledEndTime: generateScheduledEndTime(winOpen, launch.win_close),
    privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
    entityType: GuildScheduledEventEntityType.External,
    description: generateDescription(launch),
    entityMetadata: { location: getStreamUrl(launch) },
  };

  return options;
};

type EditOptions = GuildScheduledEventEditOptions<
  GuildScheduledEventStatus.Scheduled,
  GuildScheduledEventStatus.Active
>;

export const generateEventEditOptionsFromLaunch = (
  event: GuildScheduledEvent,
  launch: Launch
): null | EditOptions => {
  const newData: EditOptions = {};

  // Location
  const url = getStreamUrl(launch);
  if (event.entityMetadata.location !== url) {
    newData.entityMetadata = { location: url };
  }

  // Topic
  if (event.name !== launch.name) {
    newData.name = launch.name;
  }

  // Times
  const winOpen = new Date(launch.win_open);
  const timesDoNotMatch =
    add(event.scheduledStartAt, { minutes: 15 }).toISOString() !==
    winOpen.toISOString();

  if (timesDoNotMatch && !event.isActive()) {
    newData.scheduledStartTime = generateScheduledStartTime(winOpen);
    newData.scheduledEndTime = generateScheduledEndTime(
      winOpen,
      launch.win_close
    );
    newData.description = generateDescription(launch);
  }

  return Object.keys(newData).length ? newData : null;
};
