import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,        configure: (proxy) => {
          // Log proxy errors in full detail
          proxy.on('error', (err, req) => {
            console.error('Proxy error:', err);
            console.error('Request url:', req.url);
          });
          
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log(`Proxying ${req.method} request to: ${proxyReq.path}`);
          });
          
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log(`Received from proxy: ${proxyRes.statusCode} for ${req.url}`);
          });
        }
      }
    }
  }
});
