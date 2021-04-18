import { Client, TextChannel } from "discord.js";
import { parseCommands } from "../helpers/parseCommands";

const waitPeriod = Number(process.env.LIVECHAT_TIMEOUT) || 5000;

const formatTime = (ms: number) => {
  const s = ms / 1000;
  const m = Math.floor(s / 60);

  return `${m} minutes`;
};

export class ChannelBabysitter {
  private _timer: NodeJS.Timer;
  private _isTiming: boolean = false;
  private _client: Client;
  private _channelId: string;
  private _waitPeriod: number = waitPeriod;

  constructor(client: Client, channelId: string) {
    this._client = client;
    this._channelId = channelId;

    this._client.on("message", async (message) => {
      const isCorrectChannel = message.channel.id === this._channelId;

      const [prefix, url, ...desc] = parseCommands(message, false);

      if (prefix === "!topic" && isCorrectChannel) {
        await message.channel.send(
          "Request received! If you don't see the update right away, note that Discord limits the channel update API to 2 changes per 10 minutes. Either wait it out or ask a mod to change it manually."
        );
        await this.setTopic(
          message.channel as TextChannel,
          `🔴 Live - ${desc.join(" ")}\n\n${url}`
        );
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
          this.startTimer(newChannel);
        }
      }
    );
  }

  public startTimer(channel: TextChannel) {
    this._timer = setTimeout(() => {
      this.updateChannel(channel);
    }, this._waitPeriod);

    this._isTiming = true;
  }

  public resetTimer(channel: TextChannel) {
    clearTimeout(this._timer);
    this.startTimer(channel);
  }

  public async setTopic(channel: TextChannel, text: string) {
    try {
      await channel.setTopic(text);
    } catch (err) {
      console.error(err);
    }
  }

  public async updateChannel(channel: TextChannel) {
    if (channel.topic.includes("⚫")) {
      return;
    }

    await this.setTopic(
      channel,
      "⚫ Not Currently Live\n|\nWhen we're watching a live event, this is the channel we watch and interact with. If you want to listen along and participate, jump in!\n\nSet me using the command `!topic [STREAM_URL] [DESCRIPTION]` like `!topic https://youtu.be/dQw4w9WgXcQ Rocket Launch!`"
    );

    await channel.send(
      `It's been ${formatTime(
        this._waitPeriod
      )} since the last message. Sounds like the live event is done, so I've cleared the channel topic.`
    );

    clearTimeout(this._timer);
    this._isTiming = false;
  }
}
