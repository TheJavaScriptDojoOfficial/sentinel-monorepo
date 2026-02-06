import { useState } from 'react';
import { useSentinel } from '@sentinel-js/react';

function App() {
  // Toggle this to test different modes
  const [enableSilentMode, setEnableSilentMode] = useState(false);

  // 1. Initialize the hook
  const { hasUpdate, currentVersion, remoteVersion, reload, checkNow } = useSentinel({
    // Use a short interval for testing (e.g., 2 seconds)
    pollingInterval: 2000, 
    silent: enableSilentMode,
    onUpdateAvailable: (ver) => console.log(`[Playground] Update found: ${ver}`)
  });

  // Helper to simulate a route change (for testing silent update)
  const simulateNavigation = () => {
    window.history.pushState({}, '', '/new-fake-route');
    // We dispatch a popstate event because pushState doesn't trigger it automatically
    window.dispatchEvent(new Event('popstate'));
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Sentinel Playground</h1>
      
      {/* Status Panel */}
      <div style={{ 
        border: '1px solid #ccc', 
        padding: '1rem', 
        borderRadius: '8px',
        marginBottom: '2rem',
        background: '#f9f9f9' 
      }}>
        <h3>Debug Info</h3>
        <p><strong>Current Version:</strong> {currentVersion}</p>
        <p><strong>Remote Version:</strong> {remoteVersion || '(checking...)'}</p>
        <p><strong>Update Available:</strong> {hasUpdate ? '✅ YES' : '❌ NO'}</p>
        <p><strong>Mode:</strong> {enableSilentMode ? 'Silent (Auto-Reload)' : 'Manual (UI)'}</p>
        
        <button onClick={checkNow} style={{ marginRight: '10px' }}>
          Check for Update Now
        </button>

        <button onClick={() => setEnableSilentMode(!enableSilentMode)}>
          Toggle Silent Mode
        </button>
      </div>

      {/* SCENARIO 1: Custom UI (Manual Update) */}
      {!enableSilentMode && hasUpdate && (
        <div style={{ 
          background: '#fffae6', 
          border: '1px solid #ffe58f', 
          padding: '10px', 
          marginBottom: '20px' 
        }}>
          ⚠️ New version available! 
          <button onClick={reload} style={{ marginLeft: '10px' }}>
            Click to Reload
          </button>
        </div>
      )}

      {/* SCENARIO 2: Silent Update (requires navigation) */}
      {enableSilentMode && (
        <div style={{ padding: '10px', border: '1px dashed blue' }}>
          <p>Silent mode is ON. If an update is found, nothing will happen until you navigate.</p>
          <button onClick={simulateNavigation}>
            Simulate Route Change (Click me after update is found)
          </button>
        </div>
      )}

      {/* SCENARIO 3: Pre-built Toast Component */}
      {/* You can uncomment this to test the library's default UI */}
      {/* <SentinelToast pollingInterval={2000} /> */}
    </div>
  );
}

export default App;