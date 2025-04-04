declare module '@tauri-apps/api/dialog' {
  export function open(options: {
    multiple?: boolean;
    filters?: Array<{
      name: string;
      extensions: string[];
    }>;
  }): Promise<string | string[] | null>;
}

declare module '@tauri-apps/api/fs' {
  export function readTextFile(path: string): Promise<string>;
  export function readBinaryFile(path: string): Promise<Uint8Array>;
  export function readDir(path: string): Promise<FileEntry[]>;
  
  interface FileEntry {
    path: string;
    name: string;
    children?: FileEntry[];
    isFile: boolean;
    isDirectory: boolean;
  }
}

declare module '@tauri-apps/api/tauri' {
  export function convertFileSrc(path: string): string;
} 