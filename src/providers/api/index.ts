import mcconfig from "../../mcconfig";
import express from "express";

const api = express();

// Middleware
api.use(express.json());
if (mcconfig.env !== "production") {
  const morgan = require("morgan");
  api.use(morgan("dev"));
}

api.get("/health", (req, res) => {
  res.status(200).send("OK");
});

api.get("*", (req, res) => res.status(404).json("Invalid Resource."));

export default api;
