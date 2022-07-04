import { SanityClient } from "@sanity/client";

const client = require("@sanity/client");
const imageUrlBuilder = require("@sanity/image-url");

export const sanityClient: SanityClient = client({
  projectId: process.env.SANITY_CMS_ID,
  dataset: process.env.SANITY_DATASET || process.env.NODE_ENV || "development",
  apiVersion: "2022-06-24",
  useCdn: process.env.SANITY_CDN || true,
});

export const sanityImageUrlBuilder = imageUrlBuilder(sanityClient);
