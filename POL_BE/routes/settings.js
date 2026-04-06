const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const authMiddleware = require('../middleware/authMiddleware');

// @route   GET /api/settings
// @desc    Get app settings (singleton)
router.get('/', async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    const settingsObj = settings.toObject();
    // Mask the Groq API Key for the frontend
    if (settingsObj.groqApiKey) {
      const key = settingsObj.groqApiKey;
      settingsObj.groqApiKey = key.slice(0, 7) + "..." + key.slice(-5);
    }
    res.json(settingsObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PATCH /api/settings
// @desc    Update app settings
router.patch('/', authMiddleware, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    const updatedSettings = await settings.save();
    res.json(updatedSettings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   PUT /api/settings
// @desc    Replace app settings
router.put('/', authMiddleware, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings(req.body);
    } else {
      settings.showScrollingHeadline = req.body.showScrollingHeadline ?? settings.showScrollingHeadline;
      settings.showSidebar = req.body.showSidebar ?? settings.showSidebar;
      settings.enableTicketing = req.body.enableTicketing ?? settings.enableTicketing;
      settings.maintenanceMode = req.body.maintenanceMode ?? settings.maintenanceMode;
      settings.headlines = req.body.headlines ?? settings.headlines;

      if (req.body.contactDefaults) {
        settings.contactDefaults = { ...settings.contactDefaults, ...req.body.contactDefaults };
      }
      if (req.body.gaMeasurementId !== undefined) settings.gaMeasurementId = req.body.gaMeasurementId;
      if (req.body.clarityProjectId !== undefined) settings.clarityProjectId = req.body.clarityProjectId;
      if (req.body.gaPropertyId !== undefined) settings.gaPropertyId = req.body.gaPropertyId;

      // AI Social Proof Settings
      if (req.body.enableAiSocialProof !== undefined) settings.enableAiSocialProof = req.body.enableAiSocialProof;
      if (req.body.aiSocialProofInterval !== undefined) settings.aiSocialProofInterval = req.body.aiSocialProofInterval;
      if (req.body.showAiCloseButton !== undefined) settings.showAiCloseButton = req.body.showAiCloseButton;
      if (req.body.aiSocialProofMode !== undefined) settings.aiSocialProofMode = req.body.aiSocialProofMode;
      if (req.body.groqApiKey !== undefined) settings.groqApiKey = req.body.groqApiKey;
    }
    const updatedSettings = await settings.save();
    res.json(updatedSettings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
