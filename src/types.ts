// import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };

export type User = {
  id: string;
  name: string;
  email: string;
};

// Auth user shape coming from API responses
export type AuthUser = {
  id: number | string;
  email: string;
  username?: string;
  name?: string;
  role?: string;
  status?: string;
  accountId?: number;
  [key: string]: unknown;
};

export enum NotificationType {
  /**  Advertiser notifications  */
  Advertiser = 'ADVERTISER',
  /**  Approval related notifications for Campaign, AdItem and Creative  */
  Approval = 'APPROVAL',
  /**  Campaign, AdItem and Creative notifications  */
  Campaign = 'CAMPAIGN',
  /**  User notifications  */
  User = 'USER',
  /**  Wallet related notifications  */
  Wallet = 'WALLET'
}

export enum UserType {
  Advertiser = 'ADVERTISER',
  ApiUser = 'API_USER',
  Publisher = 'PUBLISHER'
}

export enum PermissionType {
  AccountSetup = 'ACCOUNT_SETUP',
  AdvertiserManagement = 'ADVERTISER_MANAGEMENT',
  AdInventoryPlacements = 'AD_INVENTORY_PLACEMENTS',
  AllAdvertiserCampaigns = 'ALL_ADVERTISER_CAMPAIGNS',
  AllPublisherCampaigns = 'ALL_PUBLISHER_CAMPAIGNS',
  ApprovalRequests = 'APPROVAL_REQUESTS',
  AudienceKeysValues = 'AUDIENCE_KEYS_VALUES',
  CreativeTemplate = 'CREATIVE_TEMPLATE',
  InsightDashboard = 'INSIGHT_DASHBOARD',
  OffsiteCampaigns = 'OFFSITE_CAMPAIGNS',
  OffsiteIntegrations = 'OFFSITE_INTEGRATIONS',
  PublicApiAccess = 'PUBLIC_API_ACCESS',
  ReportGeneration = 'REPORT_GENERATION',
  UserManagement = 'USER_MANAGEMENT',
  Wallet = 'WALLET',
  YieldManagement = 'YIELD'
}

export enum AccessLevel {
  NO_ACCESS = 'NO_ACCESS',
  VIEW_ACCESS = 'VIEW_ACCESS',
  FULL_ACCESS = 'FULL_ACCESS',
  CAMPAIGN_LEVEL = 'CAMPAIGN_LEVEL',
  COMPREHENSIVE_ACCESS = 'COMPREHENSIVE_ACCESS',
  MANAGE_WALLET = 'MANAGE_WALLET',
  CREATIVE_REQUESTS = 'CREATIVE_REQUESTS',
  ALL_REQUESTS = 'ALL_REQUESTS'
}

export enum RoleType {
  All = 'ALL',
  Admin = 'ADMIN',
  StandardUser = 'STANDARD_USER',
  CustomUser = 'CUSTOM_USER'
}