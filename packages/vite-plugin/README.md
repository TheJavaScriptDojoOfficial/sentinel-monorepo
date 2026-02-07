# @sentinel-js/vite-plugin

A Vite plugin that works with **`@sentinel-js/react`**. It generates a unique build hash, injects it into your app at build time, and writes a `version.json` file to your output directory so the React SDK can detect when a new version is deployed.

## Installation

```bash
npm install @sentinel-js/vite-plugin -D
# or
pnpm add -D @sentinel-js/vite-plugin
```

**Peer dependency:** `vite` ^4.0.0 or ^5.0.0 (and higher compatible versions).

## Setup

Add the plugin to your Vite config. It only runs for **production builds** (`vite build`), not for the dev server.

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import sentinelPlugin from '@sentinel-js/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    sentinelPlugin({
      fileName: 'version.json',  // optional, default: 'version.json'
      log: true,                 // optional, default: true
    }),
  ],
});
```

### Plugin options

| Option | Type | Default | Description |
|--------|------|--------|-------------|
| `fileName` | `string` | `'version.json'` | Name of the version file written to the build output (e.g. `dist/`). |
| `log` | `boolean` | `true` | If `true`, logs the generated file name and build hash to the console after the build. |

## How it works

1. **Hash generation**  
   When the plugin is applied, it generates a unique 12-character hash (MD5 of timestamp + UUID). The same hash is used for both injection and the version file.

2. **Injection**  
   The plugin adds a Vite `define` so that the global `__SENTINEL_VERSION__` is replaced in your client code with that hash string. The React SDK reads this to know the “current” build version.

3. **Version file**  
   After the bundle is written, the plugin writes a JSON file (e.g. `dist/version.json`) with the same version and a timestamp. The React SDK polls this URL (by default `/version.json`) to compare the server version with the client version.

**Example `version.json`:**

```json
{
  "version": "a1b2c3d4e5f6",
  "timestamp": 1234567890123
}
```

Your server must serve this file from the built output (e.g. same origin as the app at `/version.json`) so the SDK can fetch it without CORS issues.

## When the plugin runs

- **`vite build`:** Runs. Injects `__SENTINEL_VERSION__` and writes `version.json` to `config.build.outDir` (e.g. `dist/`).
- **`vite dev`:** Does not run (no injection, no file). The React SDK will see `__SENTINEL_VERSION__` as undefined and report version as `"unknown"` and log a warning—this is expected in development.

## Integration with @sentinel-js/react

1. Install both packages: `@sentinel-js/react` (dependency) and `@sentinel-js/vite-plugin` (dev dependency).
2. Add the plugin to `vite.config.ts` as above.
3. Use `useSentinel` or `<SentinelToast />` in your app; they will read `__SENTINEL_VERSION__` and poll `/version.json` (or the path you set via `versionFileUrl`).
4. Deploy your built app and `version.json` together; ensure the version file is served at the URL you pass as `versionFileUrl` (default `/version.json`).

## License

ISC
