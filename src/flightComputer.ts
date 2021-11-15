import { Message } from "discord.js";
import EventEmitter = require("events");
import messageCreate from "./subscriptions/messageCreate";

export default class FlightComputer extends EventEmitter {
  public handleMessageCreate(message: Message) {
    // Loop through subscriptions
    // For each, call the checker
    // If checker result is truthy, appropriate event is emitted
    messageCreate.forEach((sub) => {
      const result = sub.checker(message);
      if (result) {
        this.emit(sub.event, message, result);
      }
    });
  }
}
