declare module '@tauri-apps/api/dialog' {
  export function open(options: {
    multiple?: boolean;
    filters?: Array<{
      name: string;
      extensions: string[];
    }>;
  }): Promise<string | string[] | null>;
  
  export function save(options: {
    defaultPath?: string;
    filters?: Array<{
      name: string;
      extensions: string[];
    }>;
  }): Promise<string | null>;
}

declare module '@tauri-apps/api/fs' {
  export function readTextFile(path: string): Promise<string>;
  export function readBinaryFile(path: string): Promise<Uint8Array>;
  export function readDir(path: string): Promise<FileEntry[]>;
  export function writeTextFile(path: string, contents: string): Promise<void>;
  export function writeBinaryFile(path: string, contents: Uint8Array | ArrayBuffer): Promise<void>;
  
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