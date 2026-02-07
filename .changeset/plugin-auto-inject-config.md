---
"@sentinel-js/vite-plugin": patch
---

Automatically inject `resolve.dedupe` and `optimizeDeps.include` so users no longer need to add them manually. The plugin now runs in both dev and build; config is merged with existing user values. Fixes React hook errors (ReactCurrentDispatcher/ReactCurrentOwner) in development without extra Vite config.
