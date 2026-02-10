# Sentinel Monorepo

This repository contains the source code for **Sentinel**, a lightweight update manager for React/Vite applications. It detects when a new version of your app is deployed and handles updates gracefully—either by showing a "New version available" banner or by silently reloading on the next navigation.

## Packages

This monorepo is managed with **npm workspaces** and includes the following packages:

| Package                                                  | Description                                                                                                                |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **[`@sentinel-js/react`](./packages/react)**             | React SDK: `useSentinel` hook and `<SentinelToast />` component for polling and update UI.                                 |
| **[`@sentinel-js/vite-plugin`](./packages/vite-plugin)** | Vite plugin that generates a unique build hash and injects it into the app, and writes `version.json` to the build output. |

The React SDK depends on the Vite plugin at build time: the plugin injects `__SENTINEL_VERSION__` and writes `version.json`; the SDK polls that file and compares versions to detect updates.

## Development

### Prerequisites

- **Node.js** v18 or later
- **npm** (v7+ for workspaces) or **pnpm**

### Getting Started

1. **Clone and install dependencies:**

   ```bash
   git clone <repository-url>
   cd sentinel-monorepo
   npm install
   ```

2. **Build all packages:**

   ```bash
   npm run build
   ```

   This runs `npm run build` in each workspace (`packages/react`, `packages/vite-plugin`).

3. **Run the playground (recommended for local testing):**

   The `playground` app uses the local packages and the Sentinel plugin. Use it to verify changes end-to-end.

   ```bash
   cd playground
   npm run dev
   ```

   Then open the URL shown (e.g. `http://localhost:5173`). To test the production build and update detection:

   ```bash
   cd playground
   npm run build
   npm run preview
   ```

### Monorepo Scripts

| Script            | Description                                                                   |
| ----------------- | ----------------------------------------------------------------------------- |
| `npm run build`   | Build all workspace packages.                                                 |
| `npm run publish` | Publish all workspace packages (use with [Changesets](#publishing) workflow). |

### Package-specific scripts

- **`packages/react`:** `npm run build` (tsc + vite build), `npm run dev` (vite build --watch)
- **`packages/vite-plugin`:** `npm run build` (tsup), `npm run dev` (tsup --watch)

## Publishing

This repo uses **[Changesets](https://github.com/changesets/changesets)** for versioning and publishing.

1. **Create a changeset** (describe your change and choose which packages to bump):

   ```bash
   npx changeset
   ```

2. **Version packages** (apply changesets and update `CHANGELOG`s):

   ```bash
   npx changeset version
   ```

3. **Publish to npm** (only run when ready to release):

   ```bash
   npx changeset publish
   ```

## Project structure

```
sentinel-monorepo/
├── packages/
│   ├── react/           # @sentinel-js/react
│   │   ├── src/
│   │   ├── dist/        # built output (gitignored)
│   │   └── package.json
│   └── vite-plugin/     # @sentinel-js/vite-plugin
│       ├── src/
│       ├── dist/        # built output (gitignored)
│       └── package.json
├── playground/          # Demo app (Vite + React) using both packages
├── .changeset/          # Changeset config and pending changesets
├── package.json         # Workspace root
└── README.md
```

## License

MIT

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues and solutions, including:

- React hook errors in development mode
- Version showing as "unknown"
- Update detection not working
- Build errors with Vite 6/7
