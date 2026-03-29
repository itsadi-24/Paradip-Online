const express = require('express');
const router = express.Router();
const groqService = require('../services/groqService');
const { getSettings } = require('../models/Settings');

// Route for autonomous brand discovery based on category
router.get('/brands', async (req, res) => {
  const { category } = req.query;
  try {
    const data = await groqService.getBrandDiscovery(category || "Electronics");
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Error fetching brand intelligence." });
  }
});

// Route for high-fidelity market discovery sync
router.post('/sync-market', async (req, res) => {
  const { marketplace, category, brand, searchTerm, minPrice, maxPrice } = req.body;
  try {
    const data = await groqService.getMarketDiscovery({
      marketplace,
      category,
      brand,
      searchTerm,
      minPrice,
      maxPrice
    });
    res.json(data);
  } catch (error) {
    console.error("AI Sync Error:", error);
    res.status(500).json({ message: "AI Analysis failed. Check your Groq API Key configuration." });
  }
});

/**
 * STRATEGIC PILLAR: SKU Synthesis
 */
router.post('/synthesize-sku', async (req, res) => {
    const { name } = req.body;
    try {
        const data = await groqService.generateProductContent(name);
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: "Intelligence synthesis failed." });
    }
});

/**
 * STRATEGIC PILLAR: Repair Intelligence
 */
router.post('/repair-roadmap', async (req, res) => {
    const { ticketData } = req.body;
    try {
        const data = await groqService.generateRepairRoadmap(ticketData);
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: "Repair intelligence synthesis failed." });
    }
});

/**
 * STRATEGIC PILLAR: SEO Auto-Pilot
 */
router.post('/generate-blog', async (req, res) => {
    const { topic, category } = req.body;
    try {
        const data = await groqService.generateBlogContent(topic, category);
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: "SEO content generation failed." });
    }
});

module.exports = router;
