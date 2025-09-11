import { NextPage } from 'next';
import { ReactElement } from 'react';
import { SnackbarProps } from 'shyftlabs-dsl';

export type REDUX_ACTION = {
  type: string;
  payload?: any;
};
export type Response<T = any> = {
  data: T;
  status: number;
};

export type PaginatedResponse<T = any> = {
  data: T;
  total: number;
  page: number;
  size: number;
};

export type SortByFilters<T = any> = {
  [key in keyof T]: '-' | '+';
};

export type TSortState = {
  by: string;
  type: 'asc' | 'desc' | '1' | '-1' | '+' | '-';
};

export type PaginationArguments = {
  pagination: {
    pageSize: number;
    pageNo: number;
  };
  sort?: TSortState;
};

export type PaginationProps = {
  pagination: {
    pageNo: number;
    pageSize: number;
    total: number;
  };
};

export type PageType = ReactElement | ReactElement[];

export type NextPageWithLayout<P = {}> = NextPage<P> & {
  getLayout: (page: PageType) => ReactNode;
};

export type SelectOption<T> = {
  label?: Maybe<string>;
  value?: Maybe<string>;
  item?: Maybe<T>;
};

export type SelectList = {
  label: Maybe<string>;
  value: Maybe<string>;
  isLive?: Maybe<boolean>;
};

export type AlertProps = SnackbarProps & { autoCloseDuration?: number; id?: string };

export type DataTableActions<T> = {
  selected: Array<T>;
  resetRowSelection: (defaultState?: boolean) => void;
};
