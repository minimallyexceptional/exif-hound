"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
exports.config = {
    paths: {
        userData: path_1.default.join(electron_1.app.getPath('appData'), 'Exif-Hound'),
        cache: path_1.default.join(electron_1.app.getPath('appData'), 'Exif-Hound', 'Cache'),
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
