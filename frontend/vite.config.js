import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          // Split heavy, feature-specific libraries into their own vendor
          // chunks so they load only with the admin screens that use them.
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (/[\\/]node_modules[\\/](jspdf|jszip|html-to-image|html2canvas|file-saver)[\\/]/.test(id)) return 'vendor-export';
            if (/[\\/]node_modules[\\/](leaflet|react-leaflet|@react-leaflet)[\\/]/.test(id)) return 'vendor-maps';
            if (/[\\/]node_modules[\\/](recharts|d3-|victory-)/.test(id)) return 'vendor-charts';
            if (/[\\/]node_modules[\\/](react-quill-new|quill|react-moveable|moveable|@daybrush)[\\/]/.test(id)) return 'vendor-editor';
            if (/[\\/]node_modules[\\/](filepond|react-filepond|browser-image-compression)/.test(id)) return 'vendor-upload';
            if (/[\\/]node_modules[\\/]html5-qrcode[\\/]/.test(id)) return 'vendor-qr';
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
