import express from "express";
import mcconfig from "../mcconfig";

const api = express();

if (mcconfig.env !== "production") {
  const morgan = require("morgan");
  api.use(morgan("dev"));
}

api.use(express.json());

export default api;
