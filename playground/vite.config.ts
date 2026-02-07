import { defineConfig, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import sentinelPlugin from '../packages/vite-plugin/src/index'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), sentinelPlugin({ fileName: 'version.json' }) as PluginOption],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['@sentinel-js/react'],
  },
})
