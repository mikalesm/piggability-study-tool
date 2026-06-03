/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base is set for GitHub Pages project-page hosting (/<repo>/).
// Override with VITE_BASE=/ for root hosting or local preview.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE ?? '/piggability/',
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/engine/**/*.ts'],
      exclude: ['src/engine/index.ts', 'src/engine/**/*.test.ts'],
    },
  },
})
