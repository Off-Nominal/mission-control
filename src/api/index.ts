import mcconfig from "../mcconfig";
import express from "express";

import webhooksRouter from "./controllers/webhooks";

const api = express();

// Middleware
api.use(express.json());
if (mcconfig.env !== "production") {
  const morgan = require("morgan");
  api.use(morgan("dev"));
}

// Routers
api.use("/webhooks", webhooksRouter);
api.get("*", (req, res) => res.status(404).json("Invalid Resource."));

export default api;
