import type { Plugin } from 'vite';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export interface SentinelPluginOptions {
  /**
   * The name of the version file to generate.
   * @default 'version.json'
   */
  fileName?: string;
  
  /**
   * Whether to log the generated version hash to the console.
   * @default true
   */
  log?: boolean;
}

export default function sentinelPlugin(options: SentinelPluginOptions = {}): Plugin {
  const fileName = options.fileName || 'version.json';
  const shouldLog = options.log !== false;

  // Generate once so it's available in config() (define) and writeBundle()
  const versionHash = crypto.createHash('md5')
    .update(Date.now().toString() + crypto.randomUUID())
    .digest('hex')
    .slice(0, 12);

  let outDir: string;

  return {
    name: '@sentinel-js/vite-plugin',
    // Run in both dev and build so resolve/optimizeDeps are applied in dev
    config(userConfig) {
      const existingDedupe = userConfig.resolve?.dedupe;
      const dedupe = Array.isArray(existingDedupe)
        ? [...new Set([...existingDedupe, 'react', 'react-dom'])]
        : ['react', 'react-dom'];

      const existingInclude = userConfig.optimizeDeps?.include;
      const include = Array.isArray(existingInclude)
        ? [...new Set([...existingInclude, '@sentinel-js/react'])]
        : ['@sentinel-js/react'];

      return {
        define: {
          __SENTINEL_VERSION__: JSON.stringify(versionHash),
        },
        resolve: { ...(userConfig.resolve ?? {}), dedupe },
        optimizeDeps: { ...(userConfig.optimizeDeps ?? {}), include },
      };
    },

    configResolved(config) {
      outDir = config.build.outDir;
    },

    // 3. Write the version.json file to the build output directory
    // This allows the React SDK to poll and ask "what is the latest version?"
    async writeBundle() {
      try {
        const filePath = path.resolve(outDir, fileName);
        const content = JSON.stringify({ 
          version: versionHash, 
          timestamp: Date.now() 
        }, null, 2);
        
        await fs.writeFile(filePath, content, 'utf-8');
        
        if (shouldLog) {
          console.log(`\n\x1b[32m[Sentinel]\x1b[0m Version file generated: \x1b[1m${fileName}\x1b[0m`);
          console.log(`\x1b[32m[Sentinel]\x1b[0m Build Hash: \x1b[1m${versionHash}\x1b[0m\n`);
        }
      } catch (error) {
        console.error('\x1b[31m[Sentinel] Failed to write version file:\x1b[0m', error);
      }
    }
  };
}