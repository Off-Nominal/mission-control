import { Client, TextChannel } from "discord.js";

export class ChannelBabysitter {
  private _timer: NodeJS.Timer;
  private _isTiming: boolean;
  private _client: Client;
  private _channelId: string;
  private _waitPeriod: number = 900000; // 15 minutes

  constructor(client: Client, channelId: string, wait: number) {
    this._waitPeriod = wait;
    this._client = client;
    this._channelId = channelId;

    this._client.on("message", (message) => {
      const isCorrectChannel = message.channel.id === this._channelId;

      if (isCorrectChannel) {
        this.resetTimer(message.channel as TextChannel);
      }
    });

    this._client.on(
      "channelUpdate",
      (oldChannel: TextChannel, newChannel: TextChannel) => {
        const isCorrectChannel = oldChannel.id === this._channelId;
        const topicHasChanged = oldChannel.topic !== newChannel.topic;

        if (isCorrectChannel && topicHasChanged) {
          this.startTimer(newChannel);
        }
      }
    );
  }

  public startTimer(channel: TextChannel) {
    if (channel.id === this._channelId && !channel.topic.includes("⚫")) {
      return;
    }
    console.log("starting timer");
    const description = channel.topic;

    this._timer = setTimeout(() => {
      this.updateChannel();
    }, this._waitPeriod);
  }

  public resetTimer(channel: TextChannel) {
    console.log("detected activity, resetting timer");
    clearTimeout(this._timer);
    this.startTimer(channel);
  }

  public updateChannel() {
    console.log("Channel updated");
    console.log(this._timer);
  }
}
