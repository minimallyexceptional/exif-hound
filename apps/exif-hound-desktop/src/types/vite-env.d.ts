/// <reference types="vite/client" />

declare global {
  interface Process {
    env: {
      TAURI_DEBUG?: string;
      [key: string]: string | undefined;
    };
  }

  var process: Process;
} 