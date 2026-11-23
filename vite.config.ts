/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxy = (target: string) => ({
    target,
    changeOrigin: true,
    rewrite: (p: string) => p.replace(/^\/api\/[^/]+/, ''),
  })
  return {
    plugins: [react(), tailwindcss()],
    resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
    server: {
      proxy: {
        '/api/catalog': proxy(env.CATALOG_URL ?? 'http://localhost:8080'),
        '/api/booking': proxy(env.BOOKING_URL ?? 'http://localhost:8081'),
        '/api/tickets': proxy(env.TICKET_URL ?? 'http://localhost:8084'),
      },
    },
    test: {
      environment: 'jsdom',
      globals: false,
      setupFiles: ['src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      css: false,
    },
  }
})
