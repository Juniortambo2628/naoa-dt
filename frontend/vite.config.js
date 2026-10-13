import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss()],
    build: {
      // vendor-export (PDF/zip export) is ~700 kB but only loads when someone exports.
      chunkSizeWarningLimit: 750,
      rollupOptions: {
        output: {
          // Split heavy, feature-specific libraries into their own vendor
          // chunks so they load only with the admin screens that use them.
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (/[\\/]node_modules[\\/](jspdf|jszip|html-to-image|html2canvas|file-saver)[\\/]/.test(id)) return 'vendor-export';
            if (/[\\/]node_modules[\\/]html5-qrcode[\\/]/.test(id)) return 'vendor-qr';
            // React-dependent libraries are left to Rollup: forcing them into manual
            // chunks created a circular import where vendor-charts ran before React
            // was initialised ("Cannot read properties of undefined (reading 'forwardRef')").
            return undefined;
          },
        },
      },
    },
    server: {
      port: Number(env.VITE_PORT) || 5180,
      hmr: {
        host: 'localhost',
      },
      proxy: {
        '/api': {
          target: 'http://localhost:8005',
          changeOrigin: true,
        },
        '/uploads': {
          target: 'http://127.0.0.1:8005',
          changeOrigin: true,
        },
        '/storage': {
          target: 'http://127.0.0.1:8005',
          changeOrigin: true,
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test-setup.js',
      css: true,
      exclude: ['tests/visual/**', 'node_modules/**'],
    },
  }
})
