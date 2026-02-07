# @sentinel-js/vite-plugin

## 0.1.3

### Patch Changes

- Added MIT Licence

## 0.1.2

### Patch Changes

- 3b75791: Automatically inject `resolve.dedupe` and `optimizeDeps.include` so users no longer need to add them manually. The plugin now runs in both dev and build; config is merged with existing user values. Fixes React hook errors (ReactCurrentDispatcher/ReactCurrentOwner) in development without extra Vite config.

## 0.1.1

### Patch Changes

- Support Vite 6 and Vite 7 in peer dependencies so the plugin can be installed in apps using latest Vite.

## 0.1.0

### Minor Changes

- Initial release
