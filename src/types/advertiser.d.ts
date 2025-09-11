import { ParentCompany } from 'types';

export interface AdvertiserDropDownItem {
  label: string;
  value: Maybe<string>;
}
export interface AdvertiserAdSlotFormDropDownItem {
  name: string;
  id: Maybe<string>;
}

export interface IAdvertiserDropDown {
  advertisers?: string[];
  handleAdvertiserSelect: (advertisers: string[]) => void;
  setMappedAdvertiser?: (advertiser: string | null) => void;
}

export interface IAdvertisersDrawerProps {
  handleClose: () => void;
  parentCompany: ParentCompany;
}

export interface ISelectAdvertiserDialog {
  handleAdvertiserSelect: (advertiserId: string) => void;
  handleCancelClick: () => void;
}
