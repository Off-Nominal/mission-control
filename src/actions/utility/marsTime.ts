import { Message } from "discord.js";
import { MarsDate } from "mars-date-utils";

const spacecraft = {
  spirit: {
    lon: 184.527364,
  },
  opportunity: {
    lon: 5.5266,
  },
  curiosity: {
    lon: 222.5583,
  },
  insight: {
    lon: 224.3766,
  },
  perseverance: {
    lon: 282.5492,
  },
};

export const marsTime = (message: Message, command: string) => {
  let msg: string;
  const md = new MarsDate(new Date());

  switch (command) {
    case "mer-a":
    case "spirit": {
      const time = md.getLMST(spacecraft.spirit.lon);
      msg = `The local mean solar time (LMST) at the Spirt rover landing site is ${time}.`;
      break;
    }
    case "mer-b":
    case "opportunity": {
      const time = md.getLMST(spacecraft.opportunity.lon);
      msg = `The local mean solar time (LMST) at the Opportunity rover landing site is ${time}.`;
      break;
    }
    case "msl":
    case "curiosity": {
      const time = md.getLMST(spacecraft.curiosity.lon);
      msg = `The local mean solar time (LMST) at the Curiosity rover landing site is ${time}.`;
      break;
    }
    case "insight": {
      const time = md.getLMST(spacecraft.insight.lon);
      msg = `The local mean solar time (LMST) at the InSight lander landing site is ${time}.`;
      break;
    }
    case "percy":
    case "mars2020":
    case "perseverance": {
      const time = md.getLMST(spacecraft.perseverance.lon);
      msg = `The local mean solar time (LMST) at the Perseverance rover landing site is ${time}.`;
      break;
    }
    default: {
      const time = md.getMST();
      msg = `Airy Mean Time on Mars is currently ${time}`;
    }
  }

  return message.channel.send(msg);
};
