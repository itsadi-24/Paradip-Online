import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import sitemap from 'vite-plugin-sitemap';

// https://vitejs.dev/config/
export default defineConfig(async () => {
  let dynamicRoutes: string[] = [];
  
  try {
    const apiBase = 'https://paradiponline.com/api';
    
    // Fetch dynamic content
    const [servicesRes, productsRes, blogsRes] = await Promise.all([
      fetch(`${apiBase}/services`),
      fetch(`${apiBase}/products`),
      fetch(`${apiBase}/blogs`)
    ]);

    if (servicesRes.ok && productsRes.ok && blogsRes.ok) {
      const services = await servicesRes.json();
      const products = await productsRes.json();
      const blogs = await blogsRes.json();

      // Ensure the endpoints returned arrays before mapping
      if (Array.isArray(services)) {
        dynamicRoutes.push(...services.map((s: any) => `/service/${s.id || s._id}`));
      }
      if (Array.isArray(products)) {
        dynamicRoutes.push(...products.map((p: any) => `/product/${p.id || p._id}`));
      }
      if (Array.isArray(blogs)) {
        dynamicRoutes.push(...blogs.map((b: any) => `/blog/${b.slug}`));
      }
    } else {
      console.warn('Sitemap Generate: Non-200 response from backend API, using static routes only.');
    }
  } catch (err) {
    console.error('Sitemap Generate: Failed to fetch dynamic routes:', err);
  }

  const allRoutes = [
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
    '/privacy-policy',
    ...dynamicRoutes
  ];

  return {
    server: {
      host: '::',
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        },
        '/uploads': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        },
      },
    },
    plugins: [
      react(),
      sitemap({
        hostname: 'https://paradiponline.com',
        dynamicRoutes: allRoutes
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});
