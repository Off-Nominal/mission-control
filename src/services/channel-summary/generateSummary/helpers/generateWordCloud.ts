import axios, { AxiosRequestConfig } from "axios";
import {
  UploadApiErrorResponse,
  UploadApiOptions,
  UploadApiResponse,
} from "cloudinary";
import mcconfig from "../../../../mcconfig";
const cloudinary = require("cloudinary").v2;

// Word Cloud API - https://wordcloudapi.com

export const generateWordCloud = async (text: string) => {
  const options: AxiosRequestConfig = {
    url: "https://textvis-word-cloud-v1.p.rapidapi.com/v1/textToCloud",
    method: "post",
    data: {
      text,
      scale: 1,
      width: 800,
      height: 800,
      colors: ["#3e7493", "#a3be5f", "#bf5e56", "#e8c04f"],
    },
    headers: {
      "content-type": "application/json",
      "x-rapidapi-key": mcconfig.providers.rapidApi.key,
      "x-rapidapi-host": "textvis-word-cloud-v1.p.rapidapi.com",
    },
  };

  let wordCloudResponse;

  const cOptions: UploadApiOptions = {
    folder: "wordclouds",
  };

  try {
    wordCloudResponse = await axios.request(options);
  } catch (err) {
    throw err;
  }

  if (!wordCloudResponse) {
    throw "No wordCloudURL returned";
  }

  return cloudinary.uploader.upload(
    wordCloudResponse.data,
    cOptions,
    (error: UploadApiErrorResponse, result: UploadApiResponse) => {
      if (error) {
        throw error;
      }

      if (result) {
        return result;
      }
    }
  );
};
