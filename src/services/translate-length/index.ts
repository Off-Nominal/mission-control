import { EmbedBuilder, Message } from "discord.js";
import { Providers } from "../../providers";
import { Length, Unit } from "./Length";

const regex = new RegExp(
  /(?<=^|[\s(=])(?<sign>[-+]?)(?<length1>(?:0|[1-9](?:\d*|\d{0,2}(?:,\d{3})*))?(?:\.\d*\d)?)-?(?<length2>(?:0|[1-9](?:\d*|\d{0,2}(?:,\d{3})*))?(?:\.\d*\d)?)?(?<=\d)\s?(?<unit>mm|cm|m|km|in|ft|mi|millimeters?|centimeters?|metres?|meters?|kilometres?|kilometers?|inches?|feet?|miles?)\b/gi
);

const numConvert = (str: string) => Number(str.replace(/,/g, ""));

const normalizeUnit = (unit: string): Unit => {
  const lowerUnit = unit.toLowerCase();
  if (lowerUnit.startsWith("mm") || lowerUnit === "millimeters" || lowerUnit === "millimeter") return "mm";
  if (lowerUnit.startsWith("cm") || lowerUnit === "centimeters" || lowerUnit === "centimeter") return "cm";
  if (lowerUnit === "metres" || lowerUnit === "metre" || lowerUnit === "meters" || lowerUnit === "meter") return "m";
  if (lowerUnit.startsWith("m") && !lowerUnit.startsWith("mm") && !lowerUnit.startsWith("mi") && lowerUnit !== "millimeters" && lowerUnit !== "miles") return "m";
  if (lowerUnit.startsWith("km") || lowerUnit === "kilometers" || lowerUnit === "kilometer" || lowerUnit === "kilometres" || lowerUnit === "kilometre") return "km";
  if (lowerUnit.startsWith("in") || lowerUnit === "inches" || lowerUnit === "inch") return "in";
  if (lowerUnit.startsWith("ft") || lowerUnit === "feet" || lowerUnit === "foot") return "ft";
  if (lowerUnit.startsWith("mi") || lowerUnit === "miles" || lowerUnit === "mile") return "mi";
  return "m"; // default fallback
};

export const findLengthsToConvert = (message: Message) => {
  const matches = message.content.matchAll(regex);
  const lengthsToConvert: Length[] = [];
  const dupChecker: string[] = []; // stores simple values to check for duplicates

  for (const match of matches) {
    const { sign, length1, length2, unit } = match.groups;
    const formattedUnit = normalizeUnit(unit);

    const simpleValue1 = `${sign}${length1}${unit}`;

    // checks if value is a duplicate
    if (length1 && !dupChecker.includes(simpleValue1)) {
      dupChecker.push(simpleValue1);

      const value = sign ? -numConvert(length1) : numConvert(length1);
      lengthsToConvert.push(new Length(value, formattedUnit));
    }

    const simpleValue2 = `${length2}${unit}`;

    if (length2 && !dupChecker.includes(simpleValue2)) {
      dupChecker.push(simpleValue2);

      const value = numConvert(length2);
      lengthsToConvert.push(new Length(value, formattedUnit));
    }
  }

  return lengthsToConvert;
};

export const createLengthConversionEmbed = (lengths: Length[]) => {
  const description = lengths
    .map((length) => {
      // Determine which units to show based on the original unit
      let metricDisplay = "";
      let imperialDisplay = "";

      // For small units (mm, cm), show mm, cm, in
      if (length.millimeters < 1000 && length.centimeters < 100) {
        metricDisplay = `:straight_ruler: ${length.millimeters} mm / ${length.centimeters} cm`;
        imperialDisplay = `:flag_us: ${length.inches} in`;
      }
      // For medium units (m), show m, ft
      else if (length.meters < 1000) {
        metricDisplay = `:straight_ruler: ${length.meters} m`;
        imperialDisplay = `:flag_us: ${length.feet} ft`;
      }
      // For large units (km), show km, mi
      else {
        metricDisplay = `:straight_ruler: ${length.kilometers} km`;
        imperialDisplay = `:flag_us: ${length.miles} mi`;
      }

      return `${metricDisplay} ${imperialDisplay}`;
    })
    .join("\n");

  const embed = new EmbedBuilder({
    title: "Length Converter",
    description,
  });

  return embed;
};

export default function TranslateLength({ helperBot }: Providers) {
  helperBot.on("messageCreate", async (message) => {
    const lengthsToConvert = findLengthsToConvert(message);
    if (lengthsToConvert.length) {
      const embeds = [createLengthConversionEmbed(lengthsToConvert)];
      try {
        await message.channel.send({ embeds });
      } catch (err) {
        console.error(err);
      }
    }
  });
}