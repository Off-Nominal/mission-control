import axios from "axios";
import { Message, MessageEmbed } from "discord.js";
import { MarsDate } from "mars-date-utils";
import { spacecraftData } from "./constants";

export type SpacecraftData = {
  epoch: Date;
  lat: number;
  lon: number;
  name: string;
  logo: string;
};

const formatLatLon = (coord: number) => {
  return Math.round(coord * 100) / 100;
};

const formatLat = (coord: number) => {
  const dir = coord > 0 ? "N" : "S";
  return formatLatLon(coord) + dir;
};

const formatLon = (coord: number) => {
  return formatLatLon(coord) + "W";
};

export const marsTime = async (
  message: Message,
  command: string,
  secondCommand?: string
) => {
  const embed = new MessageEmbed();
  let data: SpacecraftData | null = null;

  const createEmbedFields = (data: SpacecraftData | null) => {
    const earthNow = new Date();
    const cd = new MarsDate(earthNow);

    if (!data) {
      return {
        avatar:
          "https://res.cloudinary.com/dj5enq03a/image/upload/v1618764208/Discord%20Assets/Mars-800h-v2_02.width-1024_ouuahe.png",
        author: "Airy Mean Time",
        lat: formatLat(0),
        lon: formatLon(0),
        lmst: cd.getLMST(0),
        ltst: cd.getLTST(0),
        description: `Time at Longitude Zero`,
        earthNow,
      };
    } else {
      const md = new MarsDate(data.epoch);
      const sol = md.getSolOfMission(data.lon);

      return {
        avatar: data.logo,
        author: data.name,
        lat: formatLat(data.lat),
        lon: formatLon(data.lon),
        lmst: cd.getLMST(data.lon),
        ltst: cd.getLTST(data.lon),
        description: `Mission Sol ${sol}`,
        earthNow,
      };
    }
  };

  switch (command) {
    case "mars": {
      if (secondCommand === "polar") {
        data = spacecraftData.polarLander;
      } else if (secondCommand === "2") {
        data = spacecraftData.mars2;
      } else if (secondCommand === "3") {
        data = spacecraftData.mars3;
      } else if (secondCommand === "6") {
        data = spacecraftData.mars6;
      }
      break;
    }
    case "viking": {
      if (secondCommand === "1") {
        data = spacecraftData.viking1;
      } else if (secondCommand === "2") {
        data = spacecraftData.viking2;
      }
      break;
    }
    case "sojourner":
    case "pathfinder": {
      data = spacecraftData.pathfinder;
      break;
    }
    case "beagle":
    case "beagle-2": {
      data = spacecraftData.beagle2;
      break;
    }
    case "mer-a":
    case "spirit": {
      data = spacecraftData.spirit;
      break;
    }
    case "mer-b":
    case "opportunity": {
      data = spacecraftData.opportunity;
      break;
    }
    case "phoenix": {
      data = spacecraftData.phoenix;
      break;
    }
    case "msl":
    case "curiosity": {
      try {
        const response = await axios.get(
          "https://mars.nasa.gov/mmgis-maps/MSL/Layers/json/MSL_waypoints_current.json"
        );
        const [
          jsonLon,
          jsonLat,
        ] = response.data.features[0].geometry.coordinates;

        const { name, logo, epoch } = spacecraftData.curiosity;

        data = {
          lat: jsonLat,
          lon: 360 - jsonLon,
          name,
          logo,
          epoch,
        };
      } catch (err) {
        console.error(err);
        data = spacecraftData.curiosity;
      }

      break;
    }
    case "schiaparelli": {
      data = spacecraftData.schiaparelli;
      break;
    }
    case "insight": {
      data = spacecraftData.insight;
      break;
    }
    case "percy":
    case "mars2020":
    case "m2020":
    case "m20":
    case "perseverance": {
      try {
        const response = await axios.get(
          "https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_waypoints_current.json"
        );
        const [
          jsonLon,
          jsonLat,
        ] = response.data.features[0].geometry.coordinates;

        const { name, logo, epoch } = spacecraftData.perseverance;

        data = {
          lat: jsonLat,
          lon: 360 - jsonLon,
          name,
          logo,
          epoch,
        };
      } catch (err) {
        console.error(err);
        data = spacecraftData.perseverance;
      }

      break;
    }
  }

  const {
    author,
    description,
    lat,
    lon,
    lmst,
    ltst,
    earthNow,
    avatar,
  } = createEmbedFields(data);

  embed
    .setAuthor(author)
    .setDescription(description)
    .addFields([
      {
        name: "Coordinates",
        value: `Lat ${lat}\nLon ${lon}`,
        inline: true,
      },
      {
        name: "Time",
        value: `LMST ${lmst}\nLTST ${ltst}`,
        inline: true,
      },
    ])
    .setTimestamp(earthNow)
    .setThumbnail(avatar);

  return message.channel.send(embed);
};
