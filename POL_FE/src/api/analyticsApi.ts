import { get } from './apiClient';

export interface RealtimeData {
  activeUsers: number;
  source?: string;
}

export interface AnalyticsOverview {
  history: {
    date: string;
    sessions: number;
    users: number;
  }[];
  totalUsers: number;
  totalSessions: number;
  avgSessionDuration: string;
}

export interface BehaviorData {
  device: {
    name: string;
    val: number;
  }[];
  geography: {
    country: string;
    users: string;
    p: number;
  }[];
}

export interface ContentData {
  pages: {
    path: string;
    name: string;
    views: string;
    time: string;
  }[];
}

export const getRealtimeData = () => get<RealtimeData>('analytics/realtime');

export const getAnalyticsOverview = () => get<AnalyticsOverview>('analytics/overview');

export const getAnalyticsBehavior = () => get<BehaviorData>('analytics/behavior');

export const getAnalyticsContent = () => get<ContentData>('analytics/content');
