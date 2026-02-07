# Vite Configuration for @sentinel-js/react

When using `@sentinel-js/react` in your Vite app, add **`@sentinel-js/vite-plugin`** to your config. The plugin handles the rest.

## Configuration

Add the plugin to your `vite.config.ts`. No other options are required for React to work correctly:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import sentinelPlugin from '@sentinel-js/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    sentinelPlugin({ fileName: 'version.json' }),
  ],
});
```

The plugin automatically:

- Sets **`resolve.dedupe`** to `['react', 'react-dom']` (and merges with any existing `dedupe` you have)
- Adds **`@sentinel-js/react`** to **`optimizeDeps.include`** (and merges with any existing `include`)

That keeps a single React instance in both dev and build, so you avoid errors like "Cannot read properties of undefined (reading 'ReactCurrentDispatcher')".

## Optional overrides

If you need to customize `dedupe` or `optimizeDeps.include`, you can still set them in your config. The plugin merges with your values and adds `react`/`react-dom` and `@sentinel-js/react` as needed.

## Testing

```bash
npm run dev     # Should work without React errors
npm run build   # Should work and detect updates correctly
npm run preview # Should work after build
```
