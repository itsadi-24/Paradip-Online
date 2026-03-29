import ReactGA from 'react-ga4';
import clarity from '@microsoft/clarity';

/**
 * Tracks a custom event in both GA4 and Microsoft Clarity
 * @param category The category of the event (e.g., 'Navigation', 'Conversion')
 * @param action The specific action taken (e.g., 'Click Get Support')
 * @param label Optional label for more context
 * @param value Optional numeric value
 */
export const trackEvent = (
  category: string,
  action: string,
  label?: string,
  value?: number
) => {
  // Track in GA4
  ReactGA.event({
    category,
    action,
    label,
    value,
  });

  // Track in Clarity
  clarity.event(action.toLowerCase().replace(/\s+/g, '_'));
  
  console.log(`📡 Event Tracked: ${category} - ${action}`);
};
