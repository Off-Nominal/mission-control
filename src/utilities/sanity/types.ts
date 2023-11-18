import { SanityDocument } from "@sanity/client";

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
