import { Message, MessageEmbed } from "discord.js";
import { Temperature } from "./types";

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
