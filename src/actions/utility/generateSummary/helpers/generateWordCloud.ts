import axios, { AxiosRequestConfig } from "axios";
import {
  UploadApiErrorResponse,
  UploadApiOptions,
  UploadApiResponse,
} from "cloudinary";
const cloudinary = require("cloudinary").v2;

const RAPID_API_KEY = process.env.RAPID_API_KEY;

export const generateWordCloud = async (text: string) => {
  const options: AxiosRequestConfig = {
    url: "https://textvis-word-cloud-v1.p.rapidapi.com/v1/textToCloud",
    method: "post",
    data: {
      text,
      scale: 0.5,
      width: 600,
      height: 600,
      colors: ["#3e7493", "#a3be5f", "#bf5e56", "#e8c04f"],
    },
    headers: {
      "content-type": "application/json",
      "x-rapidapi-key": RAPID_API_KEY,
      "x-rapidapi-host": "textvis-word-cloud-v1.p.rapidapi.com",
    },
  };

  let wordCloudResponse;

  const cOptions: UploadApiOptions = {
    folder: "wordclouds",
  };

  try {
    wordCloudResponse = await axios.request(options);
    return cloudinary.uploader.upload(
      wordCloudResponse.data,
      cOptions,
      (error: UploadApiErrorResponse, result: UploadApiResponse) => {
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
