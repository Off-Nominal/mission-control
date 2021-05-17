import { Client, MessageEmbed, TextChannel } from "discord.js";
import { parseCommands } from "../helpers/parseCommands";

const timeoutPeriod = Number(process.env.LIVECHAT_TIMEOUT_SECS) || 15;

const formatTime = (ms: number) => {
  const s = ms / 1000;
  const m = Math.floor(s / 60);

  return `${m} minutes`;
};

const requestNotification =
  "Request received! If you don't see the update right away, note that Discord limits the channel update API to 2 changes per 10 minutes. Either wait it out or ask a mod to change it manually.";

const generateInactivityEmbed = (timeout: number) => {
  const embed = new MessageEmbed();

  embed
    .setTitle("Channel Inactive")
    .setDescription(
      `It's been ${formatTime(
        timeout
      )} since the last message. Sounds like the live event is done, so I've cleared the channel topic.`
    )
    .addField("Event still happening?", "Tap the 🔄 emoji to set it back.");

  return embed;
};

const generateTopicMessage = (options?: { desc: string[]; url: string }) => {
  if (options) {
    return `🔴 Live - ${options.desc.join(" ")}\n\n${
      options.url
    }\n\nEvent over? Reset me with \`!topic reset\``;
  } else {
    return "⚫ Not Currently Live\n|\nSet me using the command `!topic [STREAM_URL] [optional_MIN_WAIT_IN_MINUTES] [DESCRIPTION]` like `!topic https://youtu.be/dQw4w9WgXcQ 45 Rocket Launch!` or `!topic https://youtu.be/dQw4w9WgXcQ Rocket Launch!`";
  }
};

export class ChannelBabysitter {
  private _timer: NodeJS.Timer;
  private _isTiming: boolean = false;
  private _client: Client;
  private _channelId: string;
  private _timeoutPeriod: number = timeoutPeriod * 1000;
  private _minWait: number | null = null;
  private _lastTopic: {
    minWait: number;
    desc: string[];
    url: string;
  } | null = null;

  constructor(client: Client, channelId: string) {
    this._client = client;
    this._channelId = channelId;

    this._client.on("message", async (message) => {
      const isCorrectChannel = message.channel.id === this._channelId;
      const [prefix, url, minWait, ...desc] = parseCommands(message, false);

      if (prefix === "!topic" && isCorrectChannel) {
        await message.channel.send(requestNotification);

        if (url === "reset") {
          this.clearTimer();
          this._minWait = null;
          this.setTopic(message.channel as TextChannel, generateTopicMessage());
        } else {
          // if the user specified a min wait, it creates a delay period here
          const wait = Number(minWait) * 60 * 1000;
          if (wait > this._timeoutPeriod && !isNaN(wait)) {
            this._minWait = wait - this._timeoutPeriod;
          }

          const description = isNaN(wait) ? [minWait, ...desc] : desc;

          // saves the topic in case user reuses it later
          this._lastTopic = {
            minWait: this._minWait,
            desc: description,
            url,
          };

          this.setTopic(
            message.channel as TextChannel,
            generateTopicMessage({ desc: description, url })
          );
        }
      }

      if (this._isTiming && isCorrectChannel) {
        this.resetTimer(message.channel as TextChannel);
      }
    });

    this._client.on(
      "channelUpdate",
      (oldChannel: TextChannel, newChannel: TextChannel) => {
        const eventIsHappening = !newChannel.topic.includes("⚫");
        const topicHasChanged = oldChannel.topic !== newChannel.topic;
        const isCorrectChannel = newChannel.id === this._channelId;

        if (
          topicHasChanged &&
          !this._isTiming &&
          eventIsHappening &&
          isCorrectChannel
        ) {
          if (this._minWait) {
            setTimeout(() => {
              this._minWait = null;
              this.startTimer(newChannel);
            }, this._minWait);
          } else {
            this.startTimer(newChannel);
          }
        }
      }
    );
  }

  //Initialization
  //Used to baseline the current state of the monitored channel, incase an event is happening when the bot boots

  public async initialize() {
    const channel = (await this._client.channels.fetch(
      this._channelId
    )) as TextChannel;
    const eventIsHappening = channel.topic.includes("🔴");
    if (eventIsHappening) {
      this.startTimer(channel);
    }
  }

  //Timer Functions

  public startTimer(channel: TextChannel) {
    this._timer = setTimeout(() => {
      this.handleInactivity(channel);
    }, this._timeoutPeriod);

    this._isTiming = true;
  }

  public clearTimer() {
    clearTimeout(this._timer);
    this._isTiming = false;
  }

  public resetTimer(channel: TextChannel) {
    clearTimeout(this._timer);
    this.startTimer(channel);
  }

  // Topic Setting

  public async setTopic(channel: TextChannel, text: string) {
    try {
      await channel.setTopic(text);
    } catch (err) {
      console.error(err);
    }
  }

  //Inactivity handler

  public async handleInactivity(channel: TextChannel) {
    this.setTopic(channel, generateTopicMessage());

    try {
      const message = await channel.send(
        generateInactivityEmbed(this._timeoutPeriod)
      );
      await message.react("🔄");
      this.clearTimer();
    } catch (err) {
      console.error(err);
    }
  }

  // Topic Recycler

  public async recycleTopic(channel: TextChannel) {
    if (this._lastTopic === null) {
      try {
        return await channel.send(
          "That event has been cleared from my memory already. You'll need to set it again using the `!topic` command."
        );
      } catch (err) {
        console.error(err);
      }
    }

    this._minWait = this._lastTopic.minWait;
    this.setTopic(channel, generateTopicMessage(this._lastTopic));

    try {
      await channel.send(requestNotification);
    } catch (err) {
      console.error(err);
    }
  }
}
