import { EmbedBuilder, Message } from "discord.js";
import { Providers } from "../../providers";
import { Temperature, Unit } from "./Temperature";

const regex = new RegExp(
  /(?<=^|[\s(=])(?<sign>[-+]?)(?<temp1>(?:0|[1-9](?:\d*|\d{0,2}(?:,\d{3})*))?(?:\.\d*\d)?)-?(?<temp2>(?:0|[1-9](?:\d*|\d{0,2}(?:,\d{3})*))?(?:\.\d*\d)?)?(?<=\d)\s?°?\s?(?<unit>C|celsius|F|fahrenheit|kelvin)\b/gi
);

const numConvert = (str: string) => Number(str.replaceAll(",", ""));

export const findTempsToConvert = (message: Message) => {
  const matches = message.content.matchAll(regex);
  const tempsToConvert: Temperature[] = [];
  const dupChecker: string[] = []; // stores simple values to check for duplicates

  for (const match of matches) {
    const { sign, temp1, temp2, unit } = match.groups;
    const formattedUnit = unit.toUpperCase().slice(0, 1) as Unit;

    const simpleValue1 = `${sign}${temp1}${unit}`;

    // checks if value is a duplicate
    if (temp1 && !dupChecker.includes(simpleValue1)) {
      dupChecker.push(simpleValue1);

      // Ignore negative Kelvin values, these aren't real temperatures
      if (sign && unit === "K") {
        continue;
      }

      const value = sign ? -numConvert(temp1) : numConvert(temp1);
      tempsToConvert.push(new Temperature(value, formattedUnit));
    }

    const simpleValue2 = `${temp2}${unit}`;

    if (temp2 && !dupChecker.includes(simpleValue2)) {
      dupChecker.push(simpleValue2);

      const value = numConvert(temp2);
      tempsToConvert.push(new Temperature(value, formattedUnit));
    }
  }

  return tempsToConvert;
};

export const createTempConversionEmbed = (temps: Temperature[]) => {
  const description = temps
    .map(
      (temp) =>
        `:flag_us: ${temp.fahrenheit} °F :earth_americas: ${temp.celsius} °C :microscope: ${temp.kelvin} K`
    )
    .join("\n");

  const embed = new EmbedBuilder({
    title: "Temperature Converter",
    description,
  });

  return embed;
};

export default function TranslateTemperature({ helperBot }: Providers) {
  helperBot.on("messageCreate", async (message) => {
    const temperaturesToConvert = findTempsToConvert(message);
    if (temperaturesToConvert.length) {
      const embeds = [createTempConversionEmbed(temperaturesToConvert)];
      try {
        await message.channel.send({ embeds });
      } catch (err) {
        console.error(err);
      }
    }
  });
}
