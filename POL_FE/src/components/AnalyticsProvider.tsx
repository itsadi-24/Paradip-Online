import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ReactGA from 'react-ga4';
import clarity from '@microsoft/clarity';

import { SettingsProvider, useSettings } from '../contexts/SettingsContext';

const AnalyticsProvider = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { settings } = useSettings();

  // Prioritize DB settings, fallback to .env for local dev
  const GA_MEASUREMENT_ID = settings?.gaMeasurementId || import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX';
  const CLARITY_PROJECT_ID = settings?.clarityProjectId || import.meta.env.VITE_CLARITY_PROJECT_ID || 'xxxxxxxxxx';

  useEffect(() => {
    // Initialize GA4
    if (GA_MEASUREMENT_ID && GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
      try {
        ReactGA.initialize(GA_MEASUREMENT_ID);
        console.log(`📊 GA4 Initialized: ${GA_MEASUREMENT_ID}`);
      } catch (e) {
        console.error('GA4 Init Error:', e);
      }
    }

    // Initialize Microsoft Clarity
    if (CLARITY_PROJECT_ID && CLARITY_PROJECT_ID !== 'xxxxxxxxxx') {
      try {
        clarity.init(CLARITY_PROJECT_ID);
        console.log(`🔍 Microsoft Clarity Initialized: ${CLARITY_PROJECT_ID}`);
      } catch (e) {
        console.error('Clarity Init Error:', e);
      }
    }
  }, [GA_MEASUREMENT_ID, CLARITY_PROJECT_ID]);

  useEffect(() => {
    // Track page views on route change
    if (GA_MEASUREMENT_ID && GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
      ReactGA.send({ 
        hitType: 'pageview', 
        page: location.pathname + location.search,
        title: document.title 
      });
    }
  }, [location, GA_MEASUREMENT_ID]);

  return <>{children}</>;
};

export default AnalyticsProvider;
