const express = require('express');
const router = express.Router();
const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const Settings = require('../models/Settings');

/**
 * Helper to get GA4 Client
 * Requires GOOGLE_APPLICATION_CREDENTIALS environment variable or a JSON key
 */
const getAnalyticsClient = () => {
  // If no credentials provided, this will fail gracefully
  try {
    return new BetaAnalyticsDataClient();
  } catch (error) {
    console.warn('⚠️ Analytics Client not initialized: Missing credentials.');
    return null;
  }
};

// @route   GET /api/analytics/realtime
// @desc    Get real-time active users
// @access  Private (Admin)
router.get('/realtime', async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    const propertyId = settings.gaPropertyId; // We'll add this to the model next

    if (!propertyId || propertyId === 'XXXXXXXXX') {
      return res.json({
        activeUsers: 12, // Mock data
        source: 'mock'
      });
    }

    const analyticsDataClient = getAnalyticsClient();
    if (!analyticsDataClient) {
      return res.json({ activeUsers: 45, source: 'mock_no_client' });
    }

    const [response] = await analyticsDataClient.runRealtimeReport({
      property: `properties/${propertyId}`,
      metrics: [{ name: 'activeUsers' }],
    });

    const activeUsers = response.rows[0]?.metricValues[0]?.value || 0;
    res.json({ activeUsers: parseInt(activeUsers) });
  } catch (error) {
    console.error('GA4 Realtime Error:', error);
    res.status(500).json({ message: 'Error fetching real-time data', error: error.message });
  }
});

// @route   GET /api/analytics/overview
// @desc    Get 7-day traffic overview
// @access  Private (Admin)
router.get('/overview', async (req, res) => {
  try {
    // Generate some mock history data for the graph
    const mockData = Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      sessions: Math.floor(Math.random() * 500) + 100,
      users: Math.floor(Math.random() * 400) + 50,
    }));

    res.json({
      history: mockData,
      totalUsers: 2450,
      totalSessions: 3100,
      avgSessionDuration: '2m 14s'
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching overview' });
  }
});

module.exports = router;
