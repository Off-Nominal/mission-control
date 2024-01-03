import mcconfig from "../mcconfig";
import contentBot from "./content-bot";
import helperBot from "./helper-bot";
import ndb2Bot from "./ndb2-bot";
import eventsBot from "./events-bot";
import api from "./api";
import ndb2Client from "./ndb2-client";
import { sanityClient, sanityImageUrlBuilder } from "../providers/sanity";
import cache from "./cache";
import githubAgent from "./github-client";
import rssProviders from "./rss-providers";
import youtube from "./youtube";
import { rllClient, rllWatcher } from "./rllc";
import { models } from "./db";
import notifications from "./notifications";

export const providers = {
  mcconfig,
  api,
  contentBot,
  helperBot,
  ndb2Bot,
  eventsBot,
  models,
  sanityClient,
  sanityImageUrlBuilder,
  ndb2Client,
  cache,
  githubAgent,
  rssProviders,
  youtube,
  rllClient,
  rllWatcher,
  notifications,
};

export type Providers = typeof providers;
