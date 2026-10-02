import { renderHook } from '@testing-library/react';
import { useTauri } from '../useTauri';

describe('useTauri hook', () => {
  // Save original window.__TAURI__ if it exists
  const originalTauri = window.__TAURI__;
  
  // Mock console.log and console.error to prevent cluttering test output
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
    
    // Reset window.__TAURI__ to its original value
    if (originalTauri) {
      window.__TAURI__ = originalTauri;
    } else {
      delete window.__TAURI__;
    }
  });
  
  it('should detect when Tauri is not available', () => {
    // Ensure Tauri is not available
    delete window.__TAURI__;
    
    const { result } = renderHook(() => useTauri());
    
    expect(result.current.isTauriAvailable).toBe(false);
    expect(result.current.isInitialized).toBe(false);
    expect(result.current.error).toBe('Tauri is not available in this environment');
  });
  
  it('should detect when Tauri is available but plugins are missing', () => {
    // Mock Tauri as available but with missing plugins
    window.__TAURI__ = {};
    
    const { result } = renderHook(() => useTauri());
    
    expect(result.current.isTauriAvailable).toBe(true);
    // Note: In the current implementation, isInitialized is set to true if window.__TAURI__ exists, 
    // regardless of whether dialog or fs plugins are available
    expect(result.current.isInitialized).toBe(true);
    expect(result.current.error).toBe('Tauri dialog plugin is not initialized, FS plugin is not initialized');
  });
  
  it('should detect when dialog plugin is available but fs plugin is missing', () => {
    // Mock Tauri with dialog available but fs missing
    window.__TAURI__ = {
      dialog: {},
    };
    
    const { result } = renderHook(() => useTauri());
    
    expect(result.current.isTauriAvailable).toBe(true);
    // Note: In the current implementation, isInitialized is set to true if window.__TAURI__ exists, 
    // regardless of whether dialog or fs plugins are available
    expect(result.current.isInitialized).toBe(true);
    expect(result.current.error).toBe('FS plugin is not initialized');
  });
  
  it('should detect when Tauri is fully available', () => {
    // Mock Tauri with all required plugins
    window.__TAURI__ = {
      dialog: {},
      fs: {},
    };
    
    const { result } = renderHook(() => useTauri());
    
    expect(result.current.isTauriAvailable).toBe(true);
    expect(result.current.isInitialized).toBe(true);
    expect(result.current.error).toBeNull();
  });
  
  it('should handle errors during Tauri initialization check', () => {
    // Mock Tauri to throw an error when accessed
    Object.defineProperty(window, '__TAURI__', {
      get: () => {
        throw new Error('Tauri access error');
      },
      configurable: true,
    });
    
    const { result } = renderHook(() => useTauri());
    
    expect(result.current.isTauriAvailable).toBe(false);
    expect(result.current.isInitialized).toBe(false);
    // Access errors are treated as "not available" by the current implementation
    expect(result.current.error).toBe('Tauri is not available in this environment');
  });
}); 