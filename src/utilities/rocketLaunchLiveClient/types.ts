export type LaunchesParams = {
  id?: string;
  cospar_id?: string;
  after_date?: string;
  before_date?: string;
  modified_since?: string;
  location_id?: string;
  pad_id?: string;
  provider_id?: string;
  tag_id?: string;
  vehicle_id?: string;
  state_abbr?: string;
  country_code?: string;
  search?: string;
  slug?: string;
  page?: string;
};

type Provider = {
  id: number;
  name: string;
  slug: string;
};

type Vehicle = {
  id: number;
  name: string;
  company_id: number;
  slug: string;
};

type Location = {
  id: number;
  name: string;
  state: string;
  statename: string;
  country: string;
  slug: string;
};

type Pad = {
  id: number;
  name: string;
  location: Location;
};

type Media = {
  id: number;
  media_url: string;
  youtube_vidid: string;
  featured: boolean;
  ldfeatured: boolean;
  approved: boolean;
};

type Mission = {
  id: number;
  name: string;
  description: null | string;
};

type Tag = {
  id: number;
  text: string;
};

export type Launch = {
  id: number;
  cospar_id: string;
  sort_date: string;
  name: string;
  provider: Provider;
  vehicle: Vehicle;
  pad: Pad;
  missions: Mission[];
  mission_description: null | string;
  launch_description: string;
  win_open: null | string;
  t0: null | string;
  win_close: null | string;
  est_date: {
    month: null | string;
    day: null | string;
    year: null | string;
    quarter: null | string;
  };
  date_str: string;
  tags: Tag[];
  slug: string;
  weather_summary: null | string;
  weather_temp: null | number;
  weather_condition: null | string;
  weather_wind_mph: null | number;
  weather_icon: null | string;
  weather_updated: null | string;
  quicktext: string;
  media: Media[];
  result: -1 | 0 | 1 | 2 | 3;
  suborbital: boolean;
  modified: string;
};

export type LaunchesResponse = {
  valid_auth: boolean;
  count: number;
  limit: number;
  total: number;
  last_page: number;
  result: Launch[];
};
