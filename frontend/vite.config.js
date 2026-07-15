import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss()],
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
