import mcconfig from "../../mcconfig";
import { SanityClient, SanityDocument } from "@sanity/client";

export interface NewsFeedDocument extends SanityDocument {
  url: string;
  name: string;
  filter?: string;
  thumbnail: string;
  diagnostic: string;
  category: string;
}

export interface NewsCategoryDocument extends SanityDocument {
  name: string;
  feeds: NewsFeedDocument[];
}

const client = require("@sanity/client");
const imageUrlBuilder = require("@sanity/image-url");

export const sanityClient: SanityClient = client({
  projectId: mcconfig.providers.sanity.cmsId,
  dataset: mcconfig.providers.sanity.dataset || mcconfig.env || "dev",
  apiVersion: "2022-06-24",
  useCdn: mcconfig.providers.sanity.cdn || true,
});

export const sanityImageUrlBuilder = imageUrlBuilder(sanityClient);
