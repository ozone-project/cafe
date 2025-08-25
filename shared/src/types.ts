import { z } from 'zod';

// Channel Types
export enum ChannelType {
  DIRECT_APP = 'DIRECT_APP',
  DIRECT_WEB = 'DIRECT_WEB',
  DIRECT_NEWSLETTER = 'DIRECT_NEWSLETTER',
  DIRECT_PODCAST = 'DIRECT_PODCAST',
  INDIRECT_SEARCH = 'INDIRECT_SEARCH',
  INDIRECT_SOCIAL = 'INDIRECT_SOCIAL',
  INDIRECT_AI = 'INDIRECT_AI',
  INDIRECT_NEWS_AGGREGATOR = 'INDIRECT_NEWS_AGGREGATOR',
}

export enum LicenseType {
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM',
  ENTERPRISE = 'ENTERPRISE',
  CUSTOM = 'CUSTOM',
}

// Zod Schemas for validation
export const PublisherSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  email: z.string().email(),
  website: z.string().url().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const ChannelSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  type: z.nativeEnum(ChannelType),
  description: z.string().optional(),
  isActive: z.boolean(),
  publisherId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const ChannelMetricSchema = z.object({
  id: z.string(),
  date: z.date(),
  users: z.number().int().min(0),
  humanUsers: z.number().int().min(0),
  botUsers: z.number().int().min(0),
  revenue: z.number().min(0),
  referrals: z.number().int().min(0),
  pageViews: z.number().int().min(0),
  channelId: z.string(),
  createdAt: z.date(),
});

export const LicenseSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  type: z.nativeEnum(LicenseType),
  description: z.string().optional(),
  pricePerMonth: z.number().min(0).optional(),
  pricePerRequest: z.number().min(0).optional(),
  maxRequests: z.number().int().min(0).optional(),
  allowBot: z.boolean(),
  allowAPI: z.boolean(),
  allowRealtime: z.boolean(),
  isActive: z.boolean(),
  publisherId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// TypeScript Types
export type Publisher = z.infer<typeof PublisherSchema>;
export type Channel = z.infer<typeof ChannelSchema>;
export type ChannelMetric = z.infer<typeof ChannelMetricSchema>;
export type License = z.infer<typeof LicenseSchema>;

// API Request/Response Types
export type CreatePublisherRequest = Omit<Publisher, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateChannelRequest = Omit<Channel, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateMetricRequest = Omit<ChannelMetric, 'id' | 'createdAt'>;

// Dashboard Data Types
export interface DashboardMetrics {
  totalUsers: number;
  totalRevenue: number;
  totalReferrals: number;
  humanVsBotRatio: number;
  channelBreakdown: Array<{
    channelId: string;
    channelName: string;
    type: ChannelType;
    users: number;
    revenue: number;
    growth: number; // percentage change
  }>;
  dailyMetrics: Array<{
    date: string;
    users: number;
    revenue: number;
    referrals: number;
  }>;
}

// Utility function to determine if channel is direct or indirect
export function isDirectChannel(type: ChannelType): boolean {
  return type.startsWith('DIRECT_');
}

export function getChannelDisplayName(type: ChannelType): string {
  const mapping: Record<ChannelType, string> = {
    [ChannelType.DIRECT_APP]: 'Mobile App',
    [ChannelType.DIRECT_WEB]: 'Website',
    [ChannelType.DIRECT_NEWSLETTER]: 'Email Newsletter',
    [ChannelType.DIRECT_PODCAST]: 'Podcast',
    [ChannelType.INDIRECT_SEARCH]: 'Search Engines',
    [ChannelType.INDIRECT_SOCIAL]: 'Social Media',
    [ChannelType.INDIRECT_AI]: 'AI Platforms',
    [ChannelType.INDIRECT_NEWS_AGGREGATOR]: 'News Aggregators',
  };
  return mapping[type];
}