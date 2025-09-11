export type CampaignStep = 'Campaign' | 'AdItem' | 'Creative';
export type TStep = {
  title: string;
  slug?: string;
  additionalProps?: { [key: string]: any };
};
