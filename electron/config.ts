import { app } from 'electron';
import path from 'path';

export interface AppConfig {
  paths: {
    userData: string;
    cache: string;
  };
  window: {
    width: number;
    height: number;
    titleBarStyle: 'hiddenInset' | 'default';
    backgroundColor: string;
  };
  security: {
    csp: string;
    protocols: {
      exifhound: {
        scheme: string;
        privileges: {
          secure: boolean;
          standard: boolean;
          supportFetchAPI: boolean;
          allowServiceWorkers: boolean;
          corsEnabled: boolean;
        };
      };
      app: {
        scheme: string;
        privileges: {
          secure: boolean;
          standard: boolean;
          supportFetchAPI: boolean;
          allowServiceWorkers: boolean;
          corsEnabled: boolean;
        };
      };
    };
  };
  fileTypes: {
    images: string[];
  };
}

export const config: AppConfig = {
  paths: {
    userData: path.join(app.getPath('appData'), 'Exif-Hound'),
    cache: path.join(app.getPath('appData'), 'Exif-Hound', 'Cache'),
  },
  window: {
    width: 1200,
    height: 800,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#1a1a1a',
  },
  security: {
    csp: [
      "default-src 'self' exifhound:",
      "script-src 'self' exifhound: 'unsafe-inline' 'unsafe-eval'",
      "img-src 'self' exifhound: data: blob: https://a.tile.openstreetmap.org https://a.tile.openstreetmap.fr https://a.tile.opentopomap.org",
      "media-src 'self' exifhound: data: blob:",
      "connect-src 'self' exifhound: https://a.tile.openstreetmap.org https://a.tile.openstreetmap.fr https://a.tile.opentopomap.org",
      "style-src 'self' exifhound: 'unsafe-inline'",
      "worker-src 'self' blob:"
    ].join('; '),
    protocols: {
      exifhound: {
        scheme: 'exifhound',
        privileges: {
          secure: true,
          standard: true,
          supportFetchAPI: true,
          allowServiceWorkers: true,
          corsEnabled: true
        }
      },
      app: {
        scheme: 'app',
        privileges: {
          secure: true,
          standard: true,
          supportFetchAPI: true,
          allowServiceWorkers: true,
          corsEnabled: true
        }
      }
    }
  },
  fileTypes: {
    images: ['jpg', 'jpeg', 'png', 'gif', 'webp']
  }
}; 