import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
// @ts-ignore - Import the JS file directly
import noServerModules from './src/plugins/noServerModules.js';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Get correct production status
  const isProduction = mode === 'production' || process.env.NODE_ENV === 'production';
  
  console.log(`Building for ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  
  // Configure production-specific optimizations
  return {
    plugins: [
      noServerModules(), // Must be first plugin
      react()
    ],
    optimizeDeps: {
      exclude: ['lucide-react'],
      include: ['zustand', 'zustand/middleware']
    },
    define: {
      // Define global constants to be replaced at build time
      '__PROD__': isProduction,
      '__DEV__': !isProduction,
    },
    resolve: {
      alias: {
        'pg-promise': '/src/shims/pg-promise.js',
        'pg': '/src/shims/pg.js',
        './lib/dbClient.js': '/src/shims/dbClient.js',
        '../lib/dbClient.js': '/src/shims/dbClient.js',
        '../../lib/dbClient.js': '/src/shims/dbClient.js',
        'dotenv': '/src/shims/dotenv.js',
        // Exclude development utilities in production builds - these must be ABSOLUTE paths
        ...(isProduction ? {
          // Add MANY path variations to make sure all imports are caught
          './utils/devLogin': path.resolve(__dirname, 'src/shims/emptyModule.js'),
          '../utils/devLogin': path.resolve(__dirname, 'src/shims/emptyModule.js'),
          '../../utils/devLogin': path.resolve(__dirname, 'src/shims/emptyModule.js'),
          '/src/utils/devLogin': path.resolve(__dirname, 'src/shims/emptyModule.js'),
          'src/utils/devLogin': path.resolve(__dirname, 'src/shims/emptyModule.js'),
          
          './utils/authDebug': path.resolve(__dirname, 'src/shims/emptyModule.js'),
          '../utils/authDebug': path.resolve(__dirname, 'src/shims/emptyModule.js'),
          '../../utils/authDebug': path.resolve(__dirname, 'src/shims/emptyModule.js'),
          '/src/utils/authDebug': path.resolve(__dirname, 'src/shims/emptyModule.js'),
          'src/utils/authDebug': path.resolve(__dirname, 'src/shims/emptyModule.js'),
          
          './utils/devCleanup': path.resolve(__dirname, 'src/shims/emptyModule.js'),
          '../utils/devCleanup': path.resolve(__dirname, 'src/shims/emptyModule.js'),
          '../../utils/devCleanup': path.resolve(__dirname, 'src/shims/emptyModule.js'),
          '/src/utils/devCleanup': path.resolve(__dirname, 'src/shims/emptyModule.js'),
          'src/utils/devCleanup': path.resolve(__dirname, 'src/shims/emptyModule.js')
        } : {})
      }
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
          configure: (proxy) => {
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
  };
});
