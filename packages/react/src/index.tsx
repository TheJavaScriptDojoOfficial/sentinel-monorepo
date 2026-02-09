import React, { useEffect, useState, useRef, useCallback } from 'react';

// --- Types ---

export interface SentinelConfig {
  /** How often to poll for updates in ms (default: 60000 / 1 min) */
  pollingInterval?: number;
  /** URL to the version file (default: '/version.json') */
  versionFileUrl?: string;
  /** If true, hard reload on route change instead of showing UI */
  silent?: boolean;
  /** Callback fired when an update is detected (useful for custom UIs) */
  onUpdateAvailable?: (version: string) => void;
  /** Automatically check for updates on window focus / visibility change */
  checkOnFocus?: boolean;
}

export interface SentinelState {
  hasUpdate: boolean;
  currentVersion: string;
  remoteVersion: string | null;
}

// --- Utilities ---

/**
 * Performs a bulletproof reload that handles both normal React apps and PWAs:
 *
 * 1. Offline safety  — aborts if offline to preserve PWA offline experience
 * 2. SW unregister   — removes all Service Workers so the PWA won't reload from stale SW cache
 * 3. CacheStorage    — clears all Cache API entries (SW unregister alone doesn't remove cached assets)
 * 4. Cache-bust      — appends a unique query param to defeat the browser's HTTP disk cache
 */
const performReload = async () => {
  // 1. Offline guard — reloading while offline would break PWA offline experience
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    console.warn('[Sentinel] Cannot update: User is offline. Aborting reload to preserve PWA.');
    return;
  }

  // 2. Unregister every Service Worker
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((r) => r.unregister()));
    } catch (error) {
      console.warn('[Sentinel] Failed to unregister service workers:', error);
    }
  }

  // 3. Purge CacheStorage (cache-first PWAs would still serve stale assets otherwise)
  if (typeof caches !== 'undefined') {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
    } catch (error) {
      console.warn('[Sentinel] Failed to clear CacheStorage:', error);
    }
  }

  // 4. Cache-bust reload — defeats the browser's standard HTTP disk cache
  const url = new URL(window.location.href);
  url.searchParams.set('sentinel_refresh', Date.now().toString());
  window.location.href = url.toString();
};

/**
 * Custom event dispatched by our History API patches.
 * Using a custom event (instead of direct callback invocation) lets every
 * listener be properly added / removed via addEventListener / removeEventListener,
 * which fixes the "accumulated wrappers" bug.
 */
const SENTINEL_ROUTE_EVENT = 'sentinel:routechange';

/**
 * Idempotent History API patch.
 * Wraps pushState / replaceState exactly once and dispatches a custom event
 * so route-change listeners can be cleanly added and removed.
 */
const patchHistory = () => {
  if (typeof history === 'undefined') return;
  if ((history as any).__sentinelPatched) return;

  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function (...args) {
    originalPushState.apply(history, args);
    window.dispatchEvent(new Event(SENTINEL_ROUTE_EVENT));
  };

  history.replaceState = function (...args) {
    originalReplaceState.apply(history, args);
    window.dispatchEvent(new Event(SENTINEL_ROUTE_EVENT));
  };

  (history as any).__sentinelPatched = true;
};

// --- The Hook ---

export const useSentinel = ({
  pollingInterval = 60000,
  versionFileUrl = '/version.json',
  silent = false,
  onUpdateAvailable,
  checkOnFocus = true,
}: SentinelConfig = {}) => {
  // Safely access the injected version, defaulting to 'unknown' if running in dev/test without plugin
  const initialVersion =
    typeof __SENTINEL_VERSION__ !== 'undefined'
      ? __SENTINEL_VERSION__
      : 'unknown';

  const [state, setState] = useState<SentinelState>({
    hasUpdate: false,
    currentVersion: initialVersion,
    remoteVersion: null,
  });

  // Refs to avoid dependency cycles in effects
  const updateFoundRef = useRef(false);
  const onUpdateAvailableRef = useRef(onUpdateAvailable);
  const currentVersionRef = useRef(initialVersion);

  // Keep callback ref fresh
  useEffect(() => {
    onUpdateAvailableRef.current = onUpdateAvailable;
  }, [onUpdateAvailable]);

  const checkForUpdate = useCallback(async () => {
    // Skip fetch when offline — avoids console noise and wasted resources
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;

    try {
      // Add timestamp to prevent caching
      const res = await fetch(`${versionFileUrl}?t=${Date.now()}`);
      if (!res.ok) return;

      const data = await res.json();
      const remoteVersion = data.version;

      // Compare versions using ref to avoid stale closure issues
      if (remoteVersion && remoteVersion !== currentVersionRef.current) {
        // Prevent duplicate triggers
        if (updateFoundRef.current) return;

        updateFoundRef.current = true;
        setState((prev) => ({ ...prev, hasUpdate: true, remoteVersion }));

        if (onUpdateAvailableRef.current) {
          onUpdateAvailableRef.current(remoteVersion);
        }
      }
    } catch (err) {
      console.error('[Sentinel] Failed to check version:', err);
    }
  }, [versionFileUrl]); // currentVersion read from ref — not a dependency

  // Effect 1: Polling, Focus, Visibility, and Online recovery
  useEffect(() => {
    if (currentVersionRef.current === 'unknown') {
      console.warn(
        '[Sentinel] Current version is unknown. Ensure @sentinel/vite-plugin is installed.',
      );
    }

    checkForUpdate(); // Initial check

    const interval = setInterval(checkForUpdate, pollingInterval);

    // Re-check when user returns to the tab (focus event)
    const onFocus = () => {
      if (checkOnFocus) checkForUpdate();
    };

    // Re-check on visibility change (more reliable than focus for tab switches)
    const onVisibilityChange = () => {
      if (checkOnFocus && document.visibilityState === 'visible') {
        checkForUpdate();
      }
    };

    // Re-check immediately when connectivity is restored
    const onOnline = () => checkForUpdate();

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('online', onOnline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('online', onOnline);
    };
  }, [checkForUpdate, pollingInterval, checkOnFocus]);

  // Effect 2: Silent Update Logic (Route Listener)
  useEffect(() => {
    if (!silent) return;

    // Ensure History API is patched (idempotent — safe to call multiple times)
    patchHistory();

    const handleRouteChange = () => {
      // Only reload if we KNOW there is an update waiting
      if (updateFoundRef.current) {
        console.log('[Sentinel] Silent update: Route changed, reloading app...');
        performReload();
      }
    };

    window.addEventListener(SENTINEL_ROUTE_EVENT, handleRouteChange);
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener(SENTINEL_ROUTE_EVENT, handleRouteChange);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [silent]);

  return {
    ...state,
    reload: performReload,
    checkNow: checkForUpdate,
  };
};

// --- The UI Component ---

export const SentinelToast: React.FC<
  SentinelConfig & { className?: string; style?: React.CSSProperties }
> = (props) => {
  const { hasUpdate, reload } = useSentinel(props);

  // Don't render if no update, or if silent mode is ON
  if (!hasUpdate || props.silent) return null;

  return (
    <div
      style={{ ...defaultStyles.toast, ...props.style }}
      className={props.className}
    >
      <span style={defaultStyles.text}>New version available</span>
      <button style={defaultStyles.button} onClick={reload}>
        Refresh
      </button>
    </div>
  );
};

const defaultStyles = {
  toast: {
    position: 'fixed' as const,
    bottom: '24px',
    right: '24px',
    backgroundColor: '#1f1f1f',
    color: '#ffffff',
    padding: '12px 20px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    zIndex: 9999,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    border: '1px solid #333',
  },
  text: {
    fontSize: '14px',
    fontWeight: 500,
  },
  button: {
    backgroundColor: '#3b82f6',
    border: 'none',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '13px',
    transition: 'background-color 0.2s',
  },
};
