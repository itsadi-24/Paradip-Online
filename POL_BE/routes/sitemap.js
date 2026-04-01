const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Service = require('../models/Service');
const Blog = require('../models/Blog');

// Base URL for the frontend
const BASE_URL = 'https://paradiponline.com';

/**
 * @route   GET /api/sitemap.xml
 * @desc    Generate a dynamic sitemap.xml
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    // Fetch all active/relevant data
    const [products, services, blogs] = await Promise.all([
      Product.find({}, '_id updatedAt'),
      Service.find({ enabled: true }, '_id updatedAt'),
      Blog.find({}, 'slug updatedAt')
    ]);

    // Static routes
    const staticRoutes = [
      '',
      '/sales',
      '/services',
      '/services/computer-and-laptop-repair',
      '/services/software-installation-support',
      '/services/custom-pc-builds',
      '/services/on-site-it-support',
      '/services/network-and-wifi-setup',
      '/services/cctv-and-security-solutions',
      '/support',
      '/about',
      '/blog',
      '/privacy-policy'
    ];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

    // Add static routes
    staticRoutes.forEach(route => {
      xml += '<url>';
      xml += `<loc>${BASE_URL}${route}</loc>`;
      xml += '<changefreq>weekly</changefreq>';
      xml += '<priority>0.8</priority>';
      xml += '</url>';
    });

    // Add dynamic products
    products.forEach(product => {
      xml += '<url>';
      xml += `<loc>${BASE_URL}/product/${product._id}</loc>`;
      xml += `<lastmod>${product.updatedAt.toISOString().split('T')[0]}</lastmod>`;
      xml += '<changefreq>monthly</changefreq>';
      xml += '<priority>0.6</priority>';
      xml += '</url>';
    });

    // Add dynamic services
    services.forEach(service => {
      xml += '<url>';
      xml += `<loc>${BASE_URL}/service/${service._id}</loc>`;
      xml += `<lastmod>${service.updatedAt.toISOString().split('T')[0]}</lastmod>`;
      xml += '<changefreq>monthly</changefreq>';
      xml += '<priority>0.7</priority>';
      xml += '</url>';
    });

    // Add dynamic blogs
    blogs.forEach(blog => {
      xml += '<url>';
      xml += `<loc>${BASE_URL}/blog/${blog.slug}</loc>`;
      xml += `<lastmod>${blog.updatedAt.toISOString().split('T')[0]}</lastmod>`;
      xml += '<changefreq>weekly</changefreq>';
      xml += '<priority>0.7</priority>';
      xml += '</url>';
    });

    xml += '</urlset>';

    res.header('Content-Type', 'application/xml');
    res.status(200).send(xml);
  } catch (error) {
    console.error('Sitemap Error:', error);
    res.status(500).send('Error generating sitemap');
  }
});

module.exports = router;
