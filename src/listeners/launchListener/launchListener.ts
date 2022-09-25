import { add, format, sub, isBefore } from "date-fns";

import {
  Collection,
  GuildScheduledEvent,
  GuildScheduledEventCreateOptions,
  GuildScheduledEventEditOptions,
  GuildScheduledEventEntityType,
  GuildScheduledEventManager,
  GuildScheduledEventPrivacyLevel,
  GuildScheduledEventStatus,
  time,
  TimestampStyles,
} from "discord.js";
import EventEmitter = require("events");
import RocketLaunchLiveClient, {
  Launch,
} from "../../utilities/rocketLaunchLiveClient";

const FIVE_MINS_IN_MS = 300000;

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

const formatDateForRLL = (date: Date): string => {
  return date.toISOString().split(".")[0] + "Z";
};

export default class LaunchListener extends EventEmitter {
  private events: Map<number, GuildScheduledEvent>;
  private client: RocketLaunchLiveClient;
  private lastModified: Date;

  constructor() {
    super();
    this.events = new Map();
    this.client = new RocketLaunchLiveClient();
  }

  public initialize(
    events: Collection<string, GuildScheduledEvent>,
    eventsManager: GuildScheduledEventManager
  ) {
    console.log(`* Initializing with ${events.size} events`);
    events.forEach((event) => {
      const rllId = event.description.match(new RegExp(/(?<=\[)(.*?)(?=\])/gm));

      if (rllId && rllId.length) {
        this.events.set(Number(rllId[0]), event);
      }
    });
    console.log(`* Only ${this.events.size} events are launches.`);
    this.syncEvents(eventsManager).then(() => this.monitor());
  }

  private syncEvents(eventsManager: GuildScheduledEventManager) {
    // GET ALL EVENTS WITHIN 7 DAYS
    const now = new Date();
    const window = add(now, { days: 7 });

    return this.client
      .fetchLaunches({
        before_date: format(window, "yyyy-MM-dd"),
        after_date: format(now, "yyyy-MM-dd"),
      })
      .then((results) => {
        console.log(
          `* Sync activity fetched ${results.length} events from RLL`
        );
        this.lastModified = new Date();
        const promises: Promise<Launch | GuildScheduledEvent | void>[] = [];

        results.forEach((launch) => {
          // ignore if it has no opening time
          // we're only creating events for launches with scheduled liftoff times
          if (!launch.win_open) {
            console.log(`* Ignoring ${launch.name}, no launch window open`);
            return;
          }

          // ignore win open in the past
          const winOpen = new Date(launch.win_open);
          if (isBefore(winOpen, now)) {
            console.log(`* Ignoring ${launch.name}, launch window in the past`);
            return;
          }

          const event = this.events.get(launch.id);

          if (event) {
            // sync it if it already exists
            console.log(`* Syncing ${launch.name}`);
            promises.push(this.syncEvent(event, launch));
          } else {
            const windowOpen = new Date(launch.win_open);
            const options: GuildScheduledEventCreateOptions = {
              name: launch.name,
              scheduledStartTime: sub(windowOpen, { minutes: 15 }),
              scheduledEndTime: launch.win_close
                ? add(new Date(launch.win_close), { minutes: 15 })
                : add(windowOpen, { minutes: 60 }),
              privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
              entityType: GuildScheduledEventEntityType.External,
              description: generateDescription(launch),
              entityMetadata: { location: getStreamUrl(launch) },
            };
            console.log(`* Adding ${launch.name}`);
            promises.push(eventsManager.create(options));
          }
        });

        // Sync any events that are not in the API call (which may have moved)

        const fetchedIds = results.map((result) => result.id);
        this.events.forEach((event, rllId) => {
          if (!fetchedIds.includes(rllId)) {
            const promise = this.client
              .fetchLaunches({ id: rllId.toString() })
              .then((launch) => {
                console.log(
                  `* Fetching ${launch[0].name}, which wasn't in the API call, and syncing`
                );
                this.syncEvent(event, launch[0]);
                return launch[0];
              });

            promises.push(promise);
          }
        });

        return Promise.allSettled(promises);
      })
      .then(() => {
        return console.log("* Discord Events and RocketLaunch.live now synced");
      })
      .catch((err) => console.error(err));
  }

  private monitor() {
    setInterval(() => {
      console.log("* Fetching new launch changes");
      this.client
        .fetchLaunches({
          modified_since: formatDateForRLL(this.lastModified),
        })
        .then((res) => {
          this.lastModified = new Date();
          console.log("* Amount of changes:", res.length);
          // console.log(res);
          const promises = [];
          res.forEach((launch) => {
            const event = this.events.get(launch.id);
            promises.push(this.syncEvent(event, launch));
          });
          return Promise.allSettled(promises);
        })
        .then(() => {
          console.log("* All launches synced");
        });
      // update any events that changed
    }, FIVE_MINS_IN_MS);
  }

  private syncEvent(event: GuildScheduledEvent, launch: Launch) {
    const newData: GuildScheduledEventEditOptions<
      GuildScheduledEventStatus.Scheduled,
      GuildScheduledEventStatus.Active
    > = {};

    // Location
    const url = getStreamUrl(launch);
    if (event.entityMetadata.location !== url) {
      newData.entityMetadata = { location: url };
    }

    // Topic
    if (event.name !== launch.name) {
      newData.name = launch.name;
    }

    // Start Time
    const windowOpen = new Date(launch.win_open);
    const eventStreamStart = event.scheduledStartAt;
    if (
      add(eventStreamStart, { minutes: 15 }).toISOString() !==
        windowOpen.toISOString() &&
      !event.isActive()
    ) {
      newData.scheduledStartTime = sub(windowOpen, { minutes: 15 });
    }

    // End time
    const eventStreamEnd = event.scheduledEndAt;
    if (launch.win_close) {
      const windowClose = new Date(launch.win_close);
      if (
        sub(eventStreamEnd, { minutes: 15 }).toISOString() !==
        windowClose.toISOString()
      ) {
        newData.scheduledEndTime = add(windowClose, {
          minutes: 15,
        });
      }
    } else {
      if (
        sub(eventStreamEnd, { minutes: 60 }).toISOString() !==
        windowOpen.toISOString()
      ) {
        newData.scheduledEndTime = add(windowOpen, {
          minutes: 60,
        });
      }
    }

    // Description
    const description = generateDescription(launch);
    if (event.description !== description) {
      newData.description = description;
    }

    if (Object.keys(newData).length) {
      return event.edit(newData).catch((err) => console.error(err));
    } else {
      console.log(`* No changes to ${launch.name}`);
    }
  }
}
