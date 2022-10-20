import { Client } from "discord.js";
import express from "express";
import fetchGuild from "../clients/actions/fetchGuild";

const generateRouter = (client: Client) => {
  const router = express.Router();

  router.get("/", (req, res) => {
    const url = new URL(req.protocol + "://" + req.get("host") + req.url);
    const discordIds = url.searchParams.getAll("id");

    if (!discordIds.length) {
      return res.status(400).json({ error: "No id parameters requested." });
    }

    const guild = fetchGuild(client);

    guild.members
      .fetch({ user: discordIds })
      .then((users) => {
        res.json(users);
      })
      .catch((err) => {
        res.json(err);
      });
  });

  return router;
};

export default generateRouter;
