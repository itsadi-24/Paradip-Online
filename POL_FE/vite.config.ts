import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import Sitemap from 'vite-plugin-sitemap';

const dynamicRoutes = [
  '/',
  '/sales',
  '/services',
  '/support',
  '/about',
  '/blog',
  '/services/computer-and-laptop-repair',
  '/services/software-installation-support',
  '/services/custom-pc-builds',
  '/services/on-site-it-support',
  '/services/network-and-wifi-setup',
  '/services/cctv-and-security-solutions',
  '/privacy-policy'
];

// https://vitejs.dev/config/
export default defineConfig({
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
    Sitemap({
      hostname: 'https://www.paradiponline.com',
      dynamicRoutes,
      generateRobotsTxt: false // Use existing public/robots.txt
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
