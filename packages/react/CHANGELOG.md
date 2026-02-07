# @sentinel-js/react

## 0.1.2

### Patch Changes

- Add required Vite configuration to README: users must add `resolve.dedupe` and `optimizeDeps.include` to prevent React instance conflicts in development mode.

## 0.1.1

### Patch Changes

- Fix "Cannot read properties of undefined (reading 'ReactCurrentOwner')" error by externalizing react/jsx-runtime and react/jsx-dev-runtime. The library build no longer inlines the JSX runtime, preventing React version conflicts in consuming apps.

## 0.1.0

### Minor Changes

- Initial release
