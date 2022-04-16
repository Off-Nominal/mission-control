import { Message, MessageEmbed } from "discord.js";

type Unit = "C" | "F" | "K";

class Temperature {
  public celsius: number;
  public fahrenheit: number;
  public kelvin: number;

  constructor(value: number, unit: Unit) {
    if (unit === "C") {
      this.celsius = value;

      this.kelvin = this.round(value + 273.15);
      this.fahrenheit = this.round(value * 1.8 + 32);
    }

    if (unit === "K") {
      this.kelvin = value;

      this.celsius = this.round(value - 273.15);
      this.fahrenheit = this.round((this.celsius - 32) / 1.8);
    }

    if (unit === "F") {
      this.fahrenheit = value;

      this.celsius = this.round((value - 32) / 1.8);
      this.kelvin = this.round(this.celsius + 273.15);
    }
  }

  private round(value) {
    return Math.round(value * 10) / 10;
  }
}

const numConvert = (str: string) => Number(str.replaceAll(",", ""));

export const findTempsToConvert = (message: Message) => {
  const regex = new RegExp(
    /(?<=^|[\s(=])(?<sign>[-+]?)(?<temp1>(?:0|[1-9](?:\d*|\d{0,2}(?:,\d{3})*))?(?:\.\d*\d)?)-?(?<temp2>(?:0|[1-9](?:\d*|\d{0,2}(?:,\d{3})*))?(?:\.\d*\d)?)?\s?°?\s?(?<unit>C|celsius|F|fahrenheit|K|kelvin)\b/gi
  );
  const matches = message.content.matchAll(regex);

  const tempsToConvert: Temperature[] = [];

  for (const match of matches) {
    const { sign, temp1, temp2, unit } = match.groups;
    const formattedUnit = unit.toUpperCase().slice(0, 1) as Unit;

    const value = sign ? -numConvert(temp1) : numConvert(temp1);
    tempsToConvert.push(new Temperature(value, formattedUnit));

    if (temp2) {
      const value = numConvert(temp2);
      tempsToConvert.push(new Temperature(value, formattedUnit));
    }
  }
  return tempsToConvert;
};

export const sendTemperatureConversions = async (
  message: Message,
  temps: Temperature[]
) => {
  const embed = new MessageEmbed({
    title: "Temperature Converter",
  });

  const fields = temps.map((temp) => {
    return [
      {
        value: `${temp.fahrenheit} °F`,
        name: ":flag_us:",
        inline: true,
      },
      {
        value: `${temp.celsius} °C`,
        name: ":earth_americas:",
        inline: true,
      },
      {
        value: `${temp.kelvin} K`,
        name: ":microscope:",
        inline: true,
      },
    ];
  });

  embed.addFields(fields.flat());

  try {
    await message.channel.send({ embeds: [embed] });
  } catch (err) {
    console.error(err);
  }
};
