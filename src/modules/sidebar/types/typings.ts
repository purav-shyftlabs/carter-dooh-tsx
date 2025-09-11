import type React from 'react';
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
  icon: React.ReactNode;
  link?: string;
  type?: string;
  show?: boolean;
  testId: string;
  assist: string;
  position?: 'top' | 'bottom';
  mobileOnly?: boolean;
  subCategories?: Array<SubCategories>;
};
