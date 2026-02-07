# Vite Configuration for @sentinel-js/react

When using `@sentinel-js/react` in your Vite app, you need to configure Vite to ensure a single React instance is used in both development and production builds.

## Required Configuration

Add the following to your `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import sentinelPlugin from '@sentinel-js/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    sentinelPlugin({ fileName: 'version.json' }),
  ],
  resolve: {
    // Ensure only one copy of React is used
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    // Include the Sentinel library in dependency pre-bundling
    // This ensures it uses the same React instance in dev mode
    include: ['@sentinel-js/react'],
  },
});
```

## Why this is needed

The `@sentinel-js/react` package externalizes `react`, `react-dom`, and `react/jsx-runtime`. In development mode, Vite needs explicit configuration to:

1. **`resolve.dedupe`**: Prevents multiple copies of React from being loaded
2. **`optimizeDeps.include`**: Forces Vite to pre-bundle the library with your app's React instance in dev mode

Without these settings, you may see errors like:
- "Cannot read properties of undefined (reading 'ReactCurrentDispatcher')"
- "Cannot read properties of undefined (reading 'ReactCurrentOwner')"

## Testing

After adding this configuration:

```bash
npm run dev    # Should work without React errors
npm run build  # Should work and detect updates correctly
npm run preview # Should work after build
```
