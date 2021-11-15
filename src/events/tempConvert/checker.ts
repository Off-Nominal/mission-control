import { Message } from "discord.js";
import { Temperature, Unit } from "./types";

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

  return tempsToConvert.length ? tempsToConvert : null;
};
