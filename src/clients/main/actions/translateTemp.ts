import { Message, MessageEmbed } from "discord.js";

type Unit = "C" | "F";

type Temperature = {
  value: number;
  unit: Unit;
};

export const findTempsToConvert = (message: Message) => {
  const regex = new RegExp(
    /(?<=^|[\s(=])(?<sign>[-+]?)(?<temp1>\d+,?\d{0,3}\.?\d*)-?(?<temp2>\d+,?\d{0,3}\.?\d*)?\s?°?(?<unit>[FC]|celsius|fahrenheit)\b/gi
  );
  const matches = message.content.matchAll(regex);

  const tempsToConvert: Temperature[] = [];

  for (const match of matches) {
    const { sign, temp1, temp2, unit } = match.groups;

    const value = sign ? -Number(temp1) : Number(temp1);

    const temp: Temperature = {
      value,
      unit: unit.toUpperCase().slice(0, 1) as Unit,
    };

    tempsToConvert.push(temp);

    if (temp2) {
      const value = Number(temp2);

      const temp: Temperature = {
        value,
        unit: unit.toUpperCase() as Unit,
      };

      tempsToConvert.push(temp);
    }
  }

  return tempsToConvert;
};

const translateTemp = (temp: Temperature): Temperature => {
  const { unit } = temp;
  const oppositeUnit = unit === "C" ? "F" : "C";
  let basis: number;

  if (unit === "C") {
    basis = (temp.value * 1.8 + 32) * 10;
  } else if (unit === "F") {
    basis = ((temp.value - 32) / 1.8) * 10;
  }

  const value = Math.round(basis) / 10;
  return {
    value,
    unit: oppositeUnit,
  };
};

export const sendTemperatureConversions = async (
  message: Message,
  temps: Temperature[]
) => {
  const embed = new MessageEmbed();
  embed.setTitle("Temperature Converter");

  let description = "";

  temps.forEach((temp) => {
    const initialTemp = temp.value.toString().concat("°", temp.unit);

    const translation = translateTemp(temp);

    const newTemp = translation?.value.toString().concat("°", translation.unit);

    description = description.concat(`${initialTemp} is ${newTemp}\n`);
  });

  embed.setDescription(description);

  try {
    await message.channel.send({ embeds: [embed] });
  } catch (err) {
    console.error(err);
  }
};
