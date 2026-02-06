import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import sentinelPlugin from '../packages/vite-plugin/src/index'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), sentinelPlugin({ fileName: 'version.json' }) as PluginOption],
  resolve: {
    dedupe: ['react', 'react-dom'],
    // Bundle library from source so a single React instance is used (avoids
    // pre-built lib inlining a different react-jsx-runtime / ReactCurrentOwner)
    alias: {
      '@sentinel-js/react': path.resolve(__dirname, '../packages/react/src/index.tsx'),
    },
  },
})
