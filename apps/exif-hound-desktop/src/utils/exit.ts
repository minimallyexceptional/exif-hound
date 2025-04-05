/**
 * Attempts to exit the application using browser-side methods
 */
export async function exitApplication(): Promise<void> {
  console.log('Attempting to exit application using browser methods...');
  
  try {
    // First check if we're in a Tauri environment
    if (window.__TAURI__) {
      console.log('Tauri detected, using Tauri API to close window');
      
      // Try using invoke to call our Rust exit commands
      try {
        await (window.__TAURI__ as any).invoke('exit_app');
        console.log('exit_app command invoked');
      } catch (exitError) {
        console.error('Failed to invoke exit_app:', exitError);
        
        try {
          await (window.__TAURI__ as any).invoke('force_exit');
          console.log('force_exit command invoked');
        } catch (forceError) {
          console.error('Failed to invoke force_exit:', forceError);
          
          try {
            await (window.__TAURI__ as any).invoke('kill_process');
            console.log('kill_process command invoked');
          } catch (killError) {
            console.error('Failed to invoke kill_process:', killError);
          }
        }
      }
    }
    
    // Fallback to browser window.close()
    console.log('Attempting browser window.close()');
    window.close();
  } catch (error) {
    console.error('All exit attempts failed:', error);
  }
}

// Add TypeScript declaration for window.__TAURI__
declare global {
  interface Window {
    __TAURI__?: {
      invoke?: (cmd: string, args?: any) => Promise<any>;
      [key: string]: any;
    };
  }
} 