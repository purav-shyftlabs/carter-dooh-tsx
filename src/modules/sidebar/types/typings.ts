export interface SubCategories {
  id: number;
  label: string;
  link: string;
  testId: string;
  show?: boolean;
}

export type menuItem = {
  id: number;
  label: string;
  icon: JSX.Element;
  link?: string;
  type?: 'button';
  show?: boolean;
  testId: string;
  assist: string;
  position?: 'top' | 'bottom';
  mobileOnly?: boolean;
  subCategories?: Array<SubCategories>;
};
