import mcconfig from "../mcconfig";
import contentBot from "./content-bot";
import helperBot from "./helper-bot";
import ndb2Bot from "./ndb2-bot";
import eventsBot from "./events-bot";
import api from "./api";
import db from "./db";
import ndb2Client from "./ndb2-client";
import { sanityClient, sanityImageUrlBuilder } from "../providers/sanity";
import cache from "./cache";
import githubAgent from "./github-client";
import rssProviders from "./rss-providers";
import youtube from "./youtube";
import rllClient from "./rllc";

export const providers = {
  mcconfig,
  api,
  contentBot,
  helperBot,
  ndb2Bot,
  eventsBot,
  db,
  sanityClient,
  sanityImageUrlBuilder,
  ndb2Client,
  cache,
  githubAgent,
  rssProviders,
  youtube,
  rllClient,
};

export type Providers = typeof providers;
