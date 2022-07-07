import EventEmitter = require("events");
import { MemberManagerEvents } from "../../types/eventEnums";
import getNextTime from "../../helpers/getNextTime";

export class MemberManager extends EventEmitter {
  private nextTimer: NodeJS.Timer;

  constructor() {
    super();
    this.scheduleNextTimer();
    this.scheduleNextTimer = this.scheduleNextTimer.bind(this);
    this.sendDelinquents = this.sendDelinquents.bind(this);
  }

  private scheduleNextTimer() {
    clearTimeout(this.nextTimer); // clears last timer

    const nextTime = getNextTime({ hour: 12 }).getTime() - Date.now();
    this.nextTimer = setTimeout(() => {
      this.sendDelinquents();
    }, nextTime);
  }

  public sendDelinquents() {
    this.emit(MemberManagerEvents.SEND_DELINQUENTS);
    this.scheduleNextTimer();
  }
}
