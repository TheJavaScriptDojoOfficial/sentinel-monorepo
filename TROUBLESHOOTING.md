# Troubleshooting Guide for @sentinel-js/react

This guide covers common issues and their solutions when using `@sentinel-js/react`.

## React Hook Errors in Development Mode

### Symptoms

When running `npm run dev`, you see errors like:
- `TypeError: Cannot read properties of undefined (reading 'ReactCurrentDispatcher')`
- `TypeError: Cannot read properties of undefined (reading 'ReactCurrentOwner')`
- `Error: Invalid hook call. Hooks can only be called inside...`

### Root Cause

These errors occur when multiple copies of React are loaded in your application. The `@sentinel-js/react` library uses React hooks, and hooks will fail if the library's React is different from your app's React.

### Solution

Add the following to your `vite.config.ts`:

```typescript
export default defineConfig({
  plugins: [react(), sentinelPlugin()],
  resolve: {
    // Ensures only one copy of React is resolved
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    // Forces Vite to pre-bundle the library with your React in dev mode
    include: ['@sentinel-js/react'],
  },
});
```

**Why this works:**
- `dedupe`: Prevents Vite from resolving multiple versions of React
- `optimizeDeps.include`: Forces the library to be pre-bundled with your app's dependencies in dev mode, ensuring it uses the same React instance

## Version Shows as "unknown"

### Symptoms

Console warning: `[Sentinel] Current version is unknown. Ensure @sentinel/vite-plugin is installed.`

### Root Cause

The `@sentinel-js/vite-plugin` is either:
1. Not installed
2. Not added to your Vite config
3. Only runs on `vite build`, not `vite dev`

### Solution

1. Install the plugin:
   ```bash
   npm install @sentinel-js/vite-plugin -D
   ```

2. Add to `vite.config.ts`:
   ```typescript
   import sentinelPlugin from '@sentinel-js/vite-plugin';
   
   export default defineConfig({
     plugins: [
       react(),
       sentinelPlugin(),
     ],
   });
   ```

3. **Note:** In development mode (`npm run dev`), the version will be `"unknown"` and that's expected. The plugin only runs during production builds (`npm run build`).

## Build Errors with Vite 6 or 7

### Symptoms

```
npm error ERESOLVE unable to resolve dependency tree
npm error peer vite@"^4.0.0 || ^5.0.0" from @sentinel-js/vite-plugin
```

### Solution

Upgrade to `@sentinel-js/vite-plugin@0.1.1` or later, which supports Vite 4, 5, 6, and 7:

```bash
npm install @sentinel-js/vite-plugin@latest -D
```

## Production Build Works but Preview Fails

### Symptoms

After `npm run build`, running `npm run preview` shows React errors in the console.

### Root Cause

If you're using an older version of `@sentinel-js/react` (0.1.0), the library incorrectly inlined React's JSX runtime.

### Solution

Upgrade to `@sentinel-js/react@0.1.1` or later:

```bash
npm install @sentinel-js/react@latest
```

Then ensure your Vite config has the settings from the first section above.

## Update Detection Not Working

### Symptoms

The app never shows "New version available" even after deploying a new build.

### Checklist

1. **Plugin is installed and configured:**
   ```typescript
   plugins: [sentinelPlugin()]
   ```

2. **`version.json` exists in your build output:**
   Check that `dist/version.json` (or your build output folder) contains:
   ```json
   {
     "version": "abc123...",
     "timestamp": 1234567890
   }
   ```

3. **Server serves the version file:**
   After deploying, visit `https://yourapp.com/version.json` in your browser. You should see the JSON.

4. **The version hash changes between builds:**
   Each build generates a unique hash. If you rebuild without changing code, a new hash is still generated.

5. **Polling interval:**
   The default is 60 seconds. For testing, use a shorter interval:
   ```tsx
   useSentinel({ pollingInterval: 5000 }) // 5 seconds
   ```

6. **CORS issues:**
   If your version file is on a different domain, ensure CORS headers allow fetching it.

## Silent Mode Not Reloading

### Symptoms

Using `silent: true`, but the app never reloads even when an update is detected.

### Root Cause

Silent mode only reloads when the user **navigates to a different route** (e.g., clicks a link). It won't reload automatically on its own.

### How Silent Mode Works

1. SDK polls and detects an update
2. Waits for a route change (e.g., `history.pushState`, `popstate`, or user clicks a link)
3. When the route changes, it calls `window.location.reload()`

### Solution

If you want immediate reload without navigation, **don't use silent mode**. Use the default UI or a custom UI with a "Refresh" button.

## Type Errors with TypeScript

### Symptoms

```
Cannot find module '@sentinel-js/react' or its corresponding type declarations.
```

### Solution

1. Ensure you're using `@sentinel-js/react@0.1.0` or later (includes TypeScript types)
2. Check that `node_modules/@sentinel-js/react/dist/index.d.ts` exists
3. Restart your TypeScript server (in VSCode: Cmd+Shift+P → "TypeScript: Restart TS Server")

## Need More Help?

If you're still experiencing issues:

1. Check the [GitHub repository](https://github.com/your-org/sentinel-monorepo) for known issues
2. Open a new issue with:
   - Your `vite.config.ts`
   - Your package.json dependencies
   - Console errors (with screenshots)
   - Steps to reproduce
