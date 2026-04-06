import { get, put } from './apiClient';

export interface Settings {
  showScrollingHeadline: boolean;
  showSidebar: boolean;
  enableTicketing: boolean;
  maintenanceMode: boolean;
  headlines: string[];
  contactDefaults: {
    address: string;
    email: string;
    salesPhone: string;
    supportPhone: string;
    complaintsPhone: string;
  };
  gaMeasurementId?: string;
  clarityProjectId?: string;
  gaPropertyId?: string;
  enableAiSocialProof?: boolean;
  aiSocialProofInterval?: number;
  showAiCloseButton?: boolean;
  aiSocialProofMode?: 'synthesis' | 'real_data';
  groqApiKey?: string;
}

export const getSettings = () => get<Settings>('settings');

export const updateSettings = (settings: Settings) => put<Settings>('settings', settings);
