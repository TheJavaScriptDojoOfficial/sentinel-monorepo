import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'], // Build for both CommonJS and ESM
  dts: true,              // Generate .d.ts files
  splitting: false,
  sourcemap: true,
  clean: true,
});