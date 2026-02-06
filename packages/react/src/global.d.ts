export {};

declare global {
  // This variable is injected by @sentinel/vite-plugin during the build
  const __SENTINEL_VERSION__: string;
  
  interface Window {
    __SENTINEL_VERSION__: string;
  }
}