'use client';

import { useEffect } from 'react';
import { initGA4, getPageInfo } from '@/lib/analytics/ga4';

/**
 * Analytics Provider
 *
 * Initializes GA4 on client mount.
 * Place this component near the root of your app (e.g., in layout.tsx).
 */
export function AnalyticsProvider() {
  useEffect(() => {
    // Initialize GA4
    initGA4();

    // Track initial page view
    const pageInfo = getPageInfo();
    if (pageInfo) {
      // Use ga4Event directly
      const { ga4Event } = require('@/lib/analytics/ga4');
      ga4Event({
        event_name: 'page_view',
        page_title: pageInfo.page_title,
        page_location: pageInfo.page_location,
        page_path: pageInfo.page_path,
      });
    }
  }, []);

  // This component does not render anything
  return null;
}
