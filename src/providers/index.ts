import mcconfig from "../mcconfig";

import {
  contentBot,
  helperBot,
  ndb2Bot,
  eventsBot,
} from "../providers/discord_clients";
import api from "../api";
import db from "../db";
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
};

export type Providers = typeof providers;
