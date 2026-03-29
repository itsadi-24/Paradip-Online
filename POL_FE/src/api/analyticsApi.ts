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

export const getRealtimeData = () => get<RealtimeData>('analytics/realtime');

export const getAnalyticsOverview = () => get<AnalyticsOverview>('analytics/overview');
