/**
 * Application management utility functions
 */

/**
 * Log the available Tauri commands and functions
 * This is helpful for debugging Tauri integration issues
 */
function logTauriAvailability() {
  if (typeof window === 'undefined') {
    console.log('Window is not defined (server-side rendering)');
    return;
  }
  
  console.log('Window object available:', typeof window !== 'undefined');
  console.log('__TAURI__ available:', !!window.__TAURI__);
  
  if (window.__TAURI__) {
    console.log('Tauri object keys:', Object.keys(window.__TAURI__));
    console.log('invoke function available:', typeof (window.__TAURI__ as any).invoke === 'function');
  }
}

/**
 * Exit flag to prevent multiple exit attempts
 */
let isExiting = false;

/**
 * Exit the application cleanly
 */
export async function exitApplication(): Promise<void> {
  // Prevent multiple exit attempts
  if (isExiting) {
    console.log('Exit already in progress, ignoring duplicate call');
    return;
  }
  
  isExiting = true;
  
  try {
    console.log('Attempting to exit application...');
    logTauriAvailability();
    
    // Check if Tauri is available
    if (typeof window === 'undefined' || !window.__TAURI__) {
      console.warn('Tauri is not available, cannot exit application');
      isExiting = false;
      return;
    }
    
    // Get the Tauri invoke function
    const tauriInvoke = (window.__TAURI__ as any)?.invoke;
    
    if (typeof tauriInvoke !== 'function') {
      console.error('Tauri invoke function not available');
      isExiting = false;
      return;
    }
    
    // First try normal exit
    try {
      console.log('Using exit_app command...');
      await tauriInvoke('exit_app');
      // We shouldn't get here if the exit is successful
      console.log('exit_app command completed but app still running');
    } catch (error) {
      console.error('Error in normal exit:', error);
      
      // Try force exit
      try {
        console.log('Using force_exit command...');
        await tauriInvoke('force_exit');
        // We shouldn't get here if the exit is successful
        console.log('force_exit command completed but app still running');
      } catch (forceError) {
        console.error('Error in force exit:', forceError);
        
        // Last resort - kill process
        try {
          console.log('Using kill_process command...');
          await tauriInvoke('kill_process');
          // We shouldn't get here if the exit is successful
          console.log('kill_process command completed but app still running');
        } catch (killError) {
          console.error('Error in kill process:', killError);
        }
      }
    }
    
    // If we get here, none of the exit commands worked
    // Try window.close() as a last resort
    console.log('All Tauri exit commands failed, trying window.close()');
    window.close();
    
    // Reset the flag if we somehow get here
    isExiting = false;
    
  } catch (error) {
    console.error('Critical error in exitApplication:', error);
    isExiting = false;
  }
} 