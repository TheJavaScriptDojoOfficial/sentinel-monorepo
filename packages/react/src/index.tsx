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
  /** Automatically check for updates on window focus */
  checkOnFocus?: boolean;
}

export interface SentinelState {
  hasUpdate: boolean;
  currentVersion: string;
  remoteVersion: string | null;
}

// --- Utilities ---

/**
 * Patches the History API to detect client-side route changes.
 * Used for the "Silent Update" feature.
 */
const patchHistory = (callback: () => void) => {
  const pushState = history.pushState;
  const replaceState = history.replaceState;

  history.pushState = function (...args) {
    pushState.apply(history, args);
    callback();
  };

  history.replaceState = function (...args) {
    replaceState.apply(history, args);
    callback();
  };

  window.addEventListener('popstate', callback);

  // Return cleanup function
  return () => {
    window.removeEventListener('popstate', callback);
    // Note: We don't restore pushState/replaceState to original 
    // because other libs might have patched it too.
  };
};

// --- The Hook ---

export const useSentinel = ({
  pollingInterval = 60000,
  versionFileUrl = '/version.json',
  silent = false,
  onUpdateAvailable,
  checkOnFocus = true
}: SentinelConfig = {}) => {
  // Safely access the injected version, defaulting to 'unknown' if running in dev/test without plugin
  const initialVersion = typeof __SENTINEL_VERSION__ !== 'undefined' 
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

  // Keep callback ref fresh
  useEffect(() => {
    onUpdateAvailableRef.current = onUpdateAvailable;
  }, [onUpdateAvailable]);

  const checkForUpdate = useCallback(async () => {
    try {
      // Add timestamp to prevent caching
      const res = await fetch(`${versionFileUrl}?t=${Date.now()}`);
      if (!res.ok) return;

      const data = await res.json();
      const remoteVersion = data.version;

      // Compare versions
      if (remoteVersion && remoteVersion !== state.currentVersion) {
        // Prevent duplicate triggers
        if (updateFoundRef.current) return;

        updateFoundRef.current = true;
        setState(prev => ({ ...prev, hasUpdate: true, remoteVersion }));
        
        if (onUpdateAvailableRef.current) {
          onUpdateAvailableRef.current(remoteVersion);
        }
      }
    } catch (err) {
      console.error('[Sentinel] Failed to check version:', err);
    }
  }, [versionFileUrl, state.currentVersion]);

  // Effect 1: Polling and Window Focus
  useEffect(() => {
    if (state.currentVersion === 'unknown') {
      console.warn('[Sentinel] Current version is unknown. Ensure @sentinel/vite-plugin is installed.');
    }

    checkForUpdate(); // Initial check

    const interval = setInterval(checkForUpdate, pollingInterval);
    
    const onFocus = () => {
      if (checkOnFocus) checkForUpdate();
    };

    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [checkForUpdate, pollingInterval, checkOnFocus, state.currentVersion]);

  // Effect 2: Silent Update Logic (Route Listener)
  useEffect(() => {
    if (!silent) return;

    const handleRouteChange = () => {
      // Only reload if we KNOW there is an update waiting
      if (updateFoundRef.current) {
        console.log('[Sentinel] Silent update: Route changed, reloading app...');
        window.location.reload();
      }
    };

    const cleanup = patchHistory(handleRouteChange);
    return cleanup;
  }, [silent]);

  const reload = () => window.location.reload();

  return {
    ...state,
    reload,
    checkNow: checkForUpdate
  };
};

// --- The UI Component ---

export const SentinelToast: React.FC<SentinelConfig & { className?: string; style?: React.CSSProperties }> = (props) => {
  const { hasUpdate, reload } = useSentinel(props);

  // Don't render if no update, or if silent mode is ON
  if (!hasUpdate || props.silent) return null;

  return (
    <div style={{ ...defaultStyles.toast, ...props.style }} className={props.className}>
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
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
  }
};