import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/postcss'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [tailwindcss],
    },
  },
  resolve: {
    alias: {
      '@/actions/user': path.resolve(__dirname, 'preview/mocks/actions/user.ts'),
      '@/actions/product': path.resolve(__dirname, 'preview/mocks/actions/product.ts'),
      '@/hooks/useRelatedBlocks': path.resolve(__dirname, 'preview/mocks/hooks/useRelatedBlocks.ts'),
      '../hooks/useRelatedBlocks': path.resolve(__dirname, 'preview/mocks/hooks/useRelatedBlocks.ts'),
      '@': path.resolve(__dirname, '.'),
    },
  },
  root: '.',
  server: {
    open: '/preview/index.html',
  },
})
