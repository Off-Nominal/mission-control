import axios from "axios";
import { EmbedBuilder } from "discord.js";
import { MarsDate } from "mars-date-utils";
import { Spacecraft, spacecraftData } from "./constants";

type JPLFeature = {
  type: string;
  properties: {
    RMC?: string;
    site?: string;
    drive?: string;
    sol: string | number;
    easting?: number;
    northing?: number;
    elev_geoid?: number;
    elev_radii?: number;
    radius?: number;
    lon?: number;
    lat?: number;
    roll?: number;
    pitch?: number;
    yaw?: number;
    yaw_rad: number;
    tilt?: number;
    dist_m?: number;
    dist_total?: number;
    yaw_deg: string;
    site_pos: string;
    dist_km: string | number;
    dist_mi: string | number;
    final?: string;
    Note?: string;
    drivetype?: string;
  };
  geometry: {
    type: string;
    coordinates: number[];
  };
};

type WaypointsResponse = {
  type: string;
  name: string;
  features: JPLFeature[];
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

export const marsTime = async (spacecraft: string) => {
  const createEmbedFields = (data: Spacecraft | null) => {
    const earthNow = new Date();
    const cd = new MarsDate(earthNow);

    if (!data) {
      return {
        avatar:
          "https://res.cloudinary.com/dj5enq03a/image/upload/v1618764208/Discord%20Assets/Mars-800h-v2_02.width-1024_ouuahe.png",
        author: "Mars Coordinated Time (MTC)",
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

  const data = spacecraftData[spacecraft];

  switch (spacecraft) {
    case "curiosity": {
      try {
        const response = await axios.get<WaypointsResponse>(
          "https://mars.nasa.gov/mmgis-maps/MSL/Layers/json/MSL_waypoints_current.json"
        );
        const [jsonLon, jsonLat] =
          response.data.features[0].geometry.coordinates;

        data.lat = jsonLat;
        data.lon = 360 - jsonLon;
      } catch (err) {
        console.error(err);
      }
      break;
    }
    case "perseverance": {
      try {
        const response = await axios.get<WaypointsResponse>(
          "https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_waypoints_current.json"
        );
        const [jsonLon, jsonLat] =
          response.data.features[0].geometry.coordinates;

        data.lat = jsonLat;
        data.lon = 360 - jsonLon;
      } catch (err) {
        console.error(err);
      }
      break;
    }
  }

  const { author, description, lat, lon, lmst, ltst, earthNow, avatar } =
    createEmbedFields(data);

  return new EmbedBuilder()
    .setAuthor({ name: author })
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
};
