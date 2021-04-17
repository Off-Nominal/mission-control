import axios from "axios";
import { Message, MessageEmbed } from "discord.js";
import { MarsDate } from "mars-date-utils";
import { spacecraftData } from "./constants";

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

export const marsTime = async (message: Message, command: string) => {
  const cd = new MarsDate(new Date());

  const embed = new MessageEmbed();

  let author: string;
  let description: string;
  let lat: string;
  let lon: string;
  let sol: number;
  let ltst: string;
  let lmst: string;

  switch (command) {
    case "mer-a":
    case "spirit": {
      const {
        spirit,
        spirit: { epoch },
      } = spacecraftData;
      const md = new MarsDate(epoch);

      author = "Spirit Rover";
      lat = formatLat(spirit.lat);
      lon = formatLon(spirit.lon);
      sol = md.getSolOfMission(spirit.lon);
      lmst = cd.getLMST(spirit.lon);
      ltst = cd.getLTST(spirit.lon);
      description = `Mission Sol ${sol}`;

      break;
    }
    case "mer-b":
    case "opportunity": {
      const {
        opportunity,
        opportunity: { epoch },
      } = spacecraftData;
      const md = new MarsDate(epoch);

      author = "Opportunity Rover";
      lat = formatLat(opportunity.lat);
      lon = formatLon(opportunity.lon);
      sol = md.getSolOfMission(opportunity.lon);
      lmst = cd.getLMST(opportunity.lon);
      ltst = cd.getLTST(opportunity.lon);
      description = `Mission Sol ${sol}`;

      break;
    }
    case "msl":
    case "curiosity": {
      const {
        curiosity,
        curiosity: { epoch },
      } = spacecraftData;
      const md = new MarsDate(epoch);

      author = "Curiosity Rover";

      try {
        const response = await axios.get(
          "https://mars.nasa.gov/mmgis-maps/MSL/Layers/json/MSL_waypoints_current.json"
        );
        const [
          jsonLon,
          jsonLat,
        ] = response.data.features[0].geometry.coordinates;
        lat = formatLat(jsonLat);
        lon = formatLon(360 - jsonLon);
        sol = md.getSolOfMission(360 - jsonLon);
        lmst = cd.getLMST(360 - jsonLon);
        ltst = cd.getLTST(360 - jsonLon);
      } catch (err) {
        console.error(err);
        lat = formatLat(curiosity.lat);
        lon = formatLon(curiosity.lon);
        sol = md.getSolOfMission(curiosity.lon);
        lmst = cd.getLMST(curiosity.lon);
        ltst = cd.getLTST(curiosity.lon);
      }

      description = `Mission Sol ${sol}`;

      break;
    }
    case "insight": {
      const {
        insight,
        insight: { epoch },
      } = spacecraftData;
      const md = new MarsDate(epoch);

      author = "InSight Lander";
      lat = formatLat(insight.lat);
      lon = formatLon(insight.lon);
      sol = md.getSolOfMission(insight.lon);
      lmst = cd.getLMST(insight.lon);
      ltst = cd.getLTST(insight.lon);
      description = `Mission Sol ${sol}`;
      break;
    }
    case "percy":
    case "mars2020":
    case "perseverance": {
      const {
        perseverance,
        perseverance: { epoch },
      } = spacecraftData;
      const md = new MarsDate(epoch);

      author = "Perseverance Rover";

      try {
        const response = await axios.get(
          "https://mars.nasa.gov/mmgis-maps/MSL/Layers/json/MSL_waypoints_current.json"
        );
        const [
          jsonLon,
          jsonLat,
        ] = response.data.features[0].geometry.coordinates;
        lat = formatLat(jsonLat);
        lon = formatLon(360 - jsonLon);
        sol = md.getSolOfMission(360 - jsonLon);
        lmst = cd.getLMST(360 - jsonLon);
        ltst = cd.getLTST(360 - jsonLon);
      } catch (err) {
        console.error(err);
        lat = formatLat(perseverance.lat);
        lon = formatLon(perseverance.lon);
        sol = md.getSolOfMission(perseverance.lon);
        lmst = cd.getLMST(perseverance.lon);
        ltst = cd.getLTST(perseverance.lon);
      }

      description = `Mission Sol ${sol}`;
      break;
    }
    default: {
      author = "Airy Mean Time";
      description = "Time at longitude zero";
      lat = "0N";
      lon = "0W";
      lmst = cd.getLMST(0);
      ltst = cd.getLTST(0);
    }
  }

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
    ]);

  return message.channel.send(embed);
};
