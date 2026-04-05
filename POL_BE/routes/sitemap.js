const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Service = require('../models/Service');
const Blog = require('../models/Blog');
const Category = require('../models/Category');

// ─── Configuration ──────────────────────────────────────────────
const BASE_URL = 'https://www.paradiponline.com';

// Google Sitemap XML namespace declarations
const SITEMAP_HEADER = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset',
  '  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
  '  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"',
  '>'
].join('\n');

const SITEMAP_FOOTER = '</urlset>';

// ─── Helper: build a single <url> entry ─────────────────────────
function buildUrl({ loc, lastmod, changefreq, priority, images }) {
  let xml = '  <url>\n';
  xml += `    <loc>${escapeXml(loc)}</loc>\n`;

  if (lastmod) {
    xml += `    <lastmod>${formatDate(lastmod)}</lastmod>\n`;
  }
  if (changefreq) {
    xml += `    <changefreq>${changefreq}</changefreq>\n`;
  }
  if (priority !== undefined) {
    xml += `    <priority>${priority.toFixed(1)}</priority>\n`;
  }

  // Google Image Sitemap extension
  if (images && images.length > 0) {
    images.forEach(img => {
      if (img.url) {
        xml += '    <image:image>\n';
        xml += `      <image:loc>${escapeXml(img.url)}</image:loc>\n`;
        if (img.title) {
          xml += `      <image:title>${escapeXml(img.title)}</image:title>\n`;
        }
        if (img.caption) {
          xml += `      <image:caption>${escapeXml(img.caption)}</image:caption>\n`;
        }
        xml += '    </image:image>\n';
      }
    });
  }

  xml += '  </url>\n';
  return xml;
}

// ─── Helper: XML-safe escaping ──────────────────────────────────
function escapeXml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ─── Helper: format date as YYYY-MM-DD (W3C format) ────────────
function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

// ─── Helper: resolve image URL to absolute ──────────────────────
function resolveImageUrl(imagePath) {
  if (!imagePath) return null;
  // Already an absolute URL
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  // Relative path – prefix with base URL
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${BASE_URL}${cleanPath}`;
}

// ─── Helper: generate a URL-friendly slug from text ─────────────
function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')    // remove non-alphanumeric
    .replace(/[\s_]+/g, '-')          // spaces/underscores to hyphens
    .replace(/-+/g, '-')              // collapse multiple hyphens
    .replace(/^-+|-+$/g, '');         // trim leading/trailing hyphens
}

/**
 * @route   GET /sitemap.xml
 * @desc    Generate a comprehensive, Google-friendly dynamic XML sitemap
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    // ── Fetch all dynamic data in parallel ──────────────────────
    const [products, services, blogs, categories] = await Promise.all([
      Product.find({}, '_id name category images description updatedAt createdAt'),
      Service.find({ enabled: true }, '_id title image updatedAt createdAt'),
      Blog.find({}, 'slug title image updatedAt createdAt'),
      Category.find({ isActive: true }, 'slug name section updatedAt')
    ]);

    let xml = SITEMAP_HEADER + '\n\n';

    // ════════════════════════════════════════════════════════════
    // 1. STATIC PAGES — Core pages with highest priority
    // ════════════════════════════════════════════════════════════
    const now = new Date();
    const staticPages = [
      { path: '',                                        priority: 1.0, changefreq: 'daily',   lastmod: now },
      { path: '/sales',                                  priority: 0.9, changefreq: 'daily',   lastmod: now },
      { path: '/services',                               priority: 0.9, changefreq: 'weekly',  lastmod: now },
      { path: '/blog',                                   priority: 0.8, changefreq: 'daily',   lastmod: now },
      { path: '/support',                                priority: 0.7, changefreq: 'monthly', lastmod: now },
      { path: '/about',                                  priority: 0.7, changefreq: 'monthly', lastmod: now },
      { path: '/privacy-policy',                         priority: 0.3, changefreq: 'yearly',  lastmod: now },
    ];

    xml += '  <!-- ══ Static Pages ══ -->\n';
    staticPages.forEach(page => {
      xml += buildUrl({
        loc: `${BASE_URL}${page.path}`,
        lastmod: page.lastmod,
        changefreq: page.changefreq,
        priority: page.priority,
      });
    });

    // ════════════════════════════════════════════════════════════
    // 2. DEDICATED SERVICE LANDING PAGES — SEO-focused pages
    // ════════════════════════════════════════════════════════════
    const serviceLandingPages = [
      { path: '/services/computer-and-laptop-repair',      priority: 0.9, changefreq: 'weekly' },
      { path: '/services/software-installation-support',   priority: 0.8, changefreq: 'weekly' },
      { path: '/services/custom-pc-builds',                priority: 0.8, changefreq: 'weekly' },
      { path: '/services/on-site-it-support',              priority: 0.8, changefreq: 'weekly' },
      { path: '/services/network-and-wifi-setup',          priority: 0.8, changefreq: 'weekly' },
      { path: '/services/cctv-and-security-solutions',     priority: 0.8, changefreq: 'weekly' },
    ];

    xml += '\n  <!-- ══ Service Landing Pages ══ -->\n';
    serviceLandingPages.forEach(page => {
      xml += buildUrl({
        loc: `${BASE_URL}${page.path}`,
        lastmod: now,
        changefreq: page.changefreq,
        priority: page.priority,
      });
    });

    // ════════════════════════════════════════════════════════════
    // 3. PRODUCTS — Dynamic product pages with image sitemaps
    // ════════════════════════════════════════════════════════════
    if (products.length > 0) {
      xml += '\n  <!-- ══ Products ══ -->\n';
      products.forEach(product => {
        // Build image entries for Google Image Sitemap
        const productImages = [];
        if (product.images && product.images.length > 0) {
          product.images.forEach(img => {
            const resolvedUrl = resolveImageUrl(img);
            if (resolvedUrl) {
              productImages.push({
                url: resolvedUrl,
                title: product.name,
                caption: `${product.name} - ${product.category || 'Product'} available at Paradip Online`,
              });
            }
          });
        }

        xml += buildUrl({
          loc: `${BASE_URL}/product/${product._id}`,
          lastmod: product.updatedAt || product.createdAt,
          changefreq: 'weekly',
          priority: 0.7,
          images: productImages,
        });
      });
    }

    // ════════════════════════════════════════════════════════════
    // 4. SERVICES — Dynamic service detail pages
    // ════════════════════════════════════════════════════════════
    if (services.length > 0) {
      xml += '\n  <!-- ══ Services ══ -->\n';
      services.forEach(service => {
        const serviceImages = [];
        const resolvedImg = resolveImageUrl(service.image);
        if (resolvedImg) {
          serviceImages.push({
            url: resolvedImg,
            title: service.title,
            caption: `${service.title} - Professional IT service by Paradip Online`,
          });
        }

        xml += buildUrl({
          loc: `${BASE_URL}/service/${service._id}`,
          lastmod: service.updatedAt || service.createdAt,
          changefreq: 'weekly',
          priority: 0.7,
          images: serviceImages,
        });
      });
    }

    // ════════════════════════════════════════════════════════════
    // 5. BLOG POSTS — Dynamic blog pages
    // ════════════════════════════════════════════════════════════
    if (blogs.length > 0) {
      xml += '\n  <!-- ══ Blog Posts ══ -->\n';
      blogs.forEach(blog => {
        const blogImages = [];
        const resolvedImg = resolveImageUrl(blog.image);
        if (resolvedImg) {
          blogImages.push({
            url: resolvedImg,
            title: blog.title,
            caption: `${blog.title} - Paradip Online Blog`,
          });
        }

        xml += buildUrl({
          loc: `${BASE_URL}/blog/${blog.slug}`,
          lastmod: blog.updatedAt || blog.createdAt,
          changefreq: 'weekly',
          priority: 0.6,
          images: blogImages,
        });
      });
    }

    xml += '\n' + SITEMAP_FOOTER;

    // ── Send response with proper headers ───────────────────────
    res.set({
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'X-Robots-Tag': 'noindex',
    });
    res.status(200).send(xml);

  } catch (error) {
    console.error('Sitemap Generation Error:', error);
    res.status(500).set('Content-Type', 'text/plain').send('Error generating sitemap');
  }
});

module.exports = router;
