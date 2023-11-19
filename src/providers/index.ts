import mcconfig from "../mcconfig";
import contentBot from "./content-bot";
import helperBot from "./helper-bot";
import ndb2Bot from "./ndb2-bot";
import eventsBot from "./events-bot";
import api from "./api";
import db from "../db";
import ndb2Client from "./ndb2-client";
import { sanityClient, sanityImageUrlBuilder } from "../providers/sanity";

export const providers = {
  mcconfig,
  contentBot,
  helperBot,
  ndb2Bot,
  eventsBot,
  api,
  db,
  sanityClient,
  sanityImageUrlBuilder,
  ndb2Client,
};

export type Providers = typeof providers;
