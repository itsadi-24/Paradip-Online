const express = require('express');
const router = express.Router();
const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const Settings = require('../models/Settings');
const path = require('path');
const fs = require('fs');

/**
 * Helper to get GA4 Client
 * Uses the service-account.json file if present in the backend folder
 */
const getAnalyticsClient = () => {
  const keyPath = path.join(__dirname, '../service-account.json');

  if (!fs.existsSync(keyPath)) {
    console.warn('⚠️ service-account.json not found. Falling back to mock data.');
    return null;
  }

  try {
    return new BetaAnalyticsDataClient({
      keyFilename: keyPath,
    });
  } catch (error) {
    console.error('❌ Error initializing Analytics Client:', error.message);
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
    const settings = await Settings.getSettings();
    const propertyId = settings.gaPropertyId;

    if (!propertyId || propertyId === 'XXXXXXXXX') {
      // Generate some mock history data for the graph
      const mockData = Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        sessions: Math.floor(Math.random() * 500) + 100,
        users: Math.floor(Math.random() * 400) + 50,
      }));

      return res.json({
        history: mockData,
        totalUsers: 2450,
        totalSessions: 3100,
        avgSessionDuration: '2m 14s'
      });
    }

    const analyticsDataClient = getAnalyticsClient();
    if (!analyticsDataClient) {
      throw new Error('Analytics Data Client not initialized');
    }

    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'date' }],
      metrics: [
        { name: 'totalUsers' },
        { name: 'sessions' },
        { name: 'averageSessionDuration' }
      ],
      orderBys: [{ dimension: { dimensionName: 'date' } }]
    });

    let totalUsers = 0;
    let totalSessions = 0;
    let totalDuration = 0;

    const history = response.rows.map(row => {
      const dateStr = row.dimensionValues[0].value;
      const formattedDate = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;

      const users = parseInt(row.metricValues[0].value || 0, 10);
      const sessions = parseInt(row.metricValues[1].value || 0, 10);
      const durationSeconds = parseFloat(row.metricValues[2].value || 0);

      totalUsers += users;
      totalSessions += sessions;
      totalDuration += durationSeconds * sessions; // approximate total duration to calculate average

      return {
        date: formattedDate,
        users,
        sessions
      };
    });

    const averageSeconds = totalSessions > 0 ? totalDuration / totalSessions : 0;
    const minutes = Math.floor(averageSeconds / 60);
    const seconds = Math.floor(averageSeconds % 60);
    const avgSessionDuration = `${minutes}m ${seconds}s`;

    res.json({
      history,
      totalUsers,
      totalSessions,
      avgSessionDuration
    });

  } catch (error) {
    console.error('GA4 Overview Error:', error);
    res.status(500).json({ message: 'Error fetching overview', error: error.message });
  }
});

// @route   GET /api/analytics/behavior
// @desc    Get device and geography distribution
// @access  Private (Admin)
router.get('/behavior', async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    const propertyId = settings.gaPropertyId;

    if (!propertyId || propertyId === 'XXXXXXXXX') {
      return res.json({
        device: [
          { name: 'Mobile', val: 65 },
          { name: 'Desktop', val: 32 },
          { name: 'Tablet', val: 3 }
        ],
        geography: [
          { country: 'Odisha, India', users: '1,240', p: 85 },
          { country: 'Other, India', users: '180', p: 12 },
          { country: 'International', users: '45', p: 3 },
        ]
      });
    }

    const analyticsDataClient = getAnalyticsClient();
    if (!analyticsDataClient) {
      throw new Error('Analytics Data Client not initialized');
    }

    // Device Report
    const [deviceRes] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [{ name: 'sessions' }]
    });

    let totalDeviceSessions = 0;
    const deviceDataRaw = deviceRes.rows.map(row => {
      const val = parseInt(row.metricValues[0].value || 0, 10);
      totalDeviceSessions += val;
      return {
        name: row.dimensionValues[0].value,
        val
      };
    });

    const device = deviceDataRaw.map(d => ({
      name: d.name,
      val: totalDeviceSessions > 0 ? Math.round((d.val / totalDeviceSessions) * 100) : 0
    }));

    // Geography Report
    const [geoRes] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'country' }, { name: 'region' }],
      metrics: [{ name: 'totalUsers' }],
      limit: 100
    });

    let totalGeoUsers = 0;
    const geoDataRaw = geoRes.rows.map(row => {
      const country = row.dimensionValues[0].value;
      const region = row.dimensionValues[1].value;
      const val = parseInt(row.metricValues[0].value || 0, 10);
      totalGeoUsers += val;

      let label = country;
      if (country === 'India') {
        label = region === 'Odisha' ? 'Odisha, India' : 'Other, India';
      }

      return { label, val };
    });

    // Group by label because "Other, India" might have multiple regions
    const groupedGeo = {};
    geoDataRaw.forEach(g => {
      groupedGeo[g.label] = (groupedGeo[g.label] || 0) + g.val;
    });

    const geography = Object.keys(groupedGeo)
      .map(key => {
        const usersCount = groupedGeo[key];
        const p = totalGeoUsers > 0 ? Math.round((usersCount / totalGeoUsers) * 100) : 0;
        return {
          country: key,
          users: usersCount.toLocaleString(),
          p
        };
      })
      .sort((a, b) => b.p - a.p)
      .slice(0, 5); // top 5 locations

    res.json({ device, geography });

  } catch (error) {
    console.error('GA4 Behavior Error:', error);
    res.status(500).json({ message: 'Error fetching behavior data', error: error.message });
  }
});

// @route   GET /api/analytics/content
// @desc    Get top performing pages
// @access  Private (Admin)
router.get('/content', async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    const propertyId = settings.gaPropertyId;

    if (!propertyId || propertyId === 'XXXXXXXXX') {
      return res.json({
        pages: [
          { path: '/', name: 'Home', views: '1,420', time: '1m 24s' },
          { path: '/services', name: 'Services', views: '980', time: '2m 10s' },
          { path: '/support', name: 'Get Support', views: '654', time: '4m 05s' },
          { path: '/sales', name: 'Shop', views: '430', time: '1m 15s' },
          { path: '/blog/computer-maintenance', name: 'Blog: PC Care', views: '320', time: '3m 45s' },
        ]
      });
    }

    const analyticsDataClient = getAnalyticsClient();
    if (!analyticsDataClient) {
      throw new Error('Analytics Data Client not initialized');
    }

    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
      metrics: [{ name: 'screenPageViews' }, { name: 'averageSessionDuration' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 10
    });

    const pages = response.rows.map(row => {
      const path = row.dimensionValues[0].value;
      const name = row.dimensionValues[1].value;
      const views = parseInt(row.metricValues[0].value || 0, 10).toLocaleString();

      const durationSeconds = parseFloat(row.metricValues[1].value || 0);
      const minutes = Math.floor(durationSeconds / 60);
      const seconds = Math.floor(durationSeconds % 60);
      const time = `${minutes}m ${seconds}s`;

      return { path, name, views, time };
    });

    res.json({ pages });

  } catch (error) {
    console.error('GA4 Content Error:', error);
    res.status(500).json({ message: 'Error fetching content data', error: error.message });
  }
});

module.exports = router;
