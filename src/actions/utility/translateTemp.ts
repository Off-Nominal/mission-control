import { Message, MessageEmbed } from "discord.js";

type Unit = "C" | "F";

type Temperature = {
  value: number;
  unit: Unit;
};

export const findTempsToConvert = (message: Message) => {
  const regex = new RegExp(/(?<temp>\d{1,4}).{0,3}(?<unit>[F,C])/gi);
  const matches = message.content.matchAll(regex);

  const tempsToConvert: Temperature[] = [];

  for (const match of matches) {
    const temp: Temperature = {
      value: Number(match[1]),
      unit: match[2] as Unit,
    };

    tempsToConvert.push(temp);
  }

  return tempsToConvert;
};

const translateTemp = (temp: Temperature): Temperature => {
  if (temp.unit === "C") {
    const basis = (temp.value * 1.8 + 32) * 10;
    const value = Math.round(basis) / 10;
    return {
      value,
      unit: "F",
    };
  } else if (temp.unit === "F") {
    const basis = ((temp.value - 32) / 1.8) * 10;
    const value = Math.round(basis) / 10;
    return {
      value,
      unit: "C",
    };
  }
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

    const newTemp = translation.value.toString().concat("°", translation.unit);

    description = description.concat(`${initialTemp} is ${newTemp}\n`);
  });

  embed.setDescription(description);

  try {
    await message.channel.send(embed);
  } catch (err) {
    console.error(err);
  }
};
