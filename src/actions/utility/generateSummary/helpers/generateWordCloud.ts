import axios, { Method } from "axios";
const cloudinary = require("cloudinary").v2;

const RAPID_API_KEY = process.env.RAPID_API_KEY;

export const generateWordCloud = async (text: string) => {
  const options = {
    url: "https://textvis-word-cloud-v1.p.rapidapi.com/v1/textToCloud",
    method: "post" as Method,
    data: {
      text,
      scale: 0.5,
      width: 600,
      height: 600,
    },
    headers: {
      "content-type": "application/json",
      "x-rapidapi-key": RAPID_API_KEY,
      "x-rapidapi-host": "textvis-word-cloud-v1.p.rapidapi.com",
    },
  };

  let wordCloudResponse;

  const cOptions = {
    folder: "wordclouds",
  };

  try {
    wordCloudResponse = await axios.request(options);
    return cloudinary.uploader.upload(
      wordCloudResponse.data,
      cOptions,
      (error, result) => {
        if (error) {
          console.error(error);
        }

        if (result) {
          return result.secure_url;
        }
      }
    );
  } catch (err) {
    console.error(err);
  }
};
