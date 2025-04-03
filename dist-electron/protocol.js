"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProtocolManager = void 0;
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const config_1 = require("./config");
class ProtocolManager {
    static registerSchemes() {
        // Register schemes
        electron_1.protocol.registerSchemesAsPrivileged([
            {
                scheme: config_1.config.security.protocols.exifhound.scheme,
                privileges: config_1.config.security.protocols.exifhound.privileges
            },
            {
                scheme: config_1.config.security.protocols.app.scheme,
                privileges: config_1.config.security.protocols.app.privileges
            }
        ]);
    }
    static setupProtocols() {
        // Register file protocol
        electron_1.protocol.registerFileProtocol('file', (request, callback) => {
            const filePath = decodeURIComponent(request.url.slice('file://'.length));
            console.log('File protocol request:', filePath);
            try {
                if (!fs_1.default.existsSync(filePath)) {
                    console.error('File does not exist:', filePath);
                    callback({ path: '' });
                    return;
                }
                const stats = fs_1.default.statSync(filePath);
                console.log('File stats:', stats);
                callback({ path: filePath });
            }
            catch (error) {
                console.error('Error accessing file:', error);
                callback({ path: '' });
            }
        });
        // Register exifhound protocol
        electron_1.protocol.registerFileProtocol(config_1.config.security.protocols.exifhound.scheme, (request, callback) => {
            const url = request.url.substr(`${config_1.config.security.protocols.exifhound.scheme}://`.length);
            const filePath = path_1.default.normalize(`${__dirname}/../${url}`);
            console.log('Exifhound protocol request:', filePath);
            callback({ path: filePath });
        });
        // Register app protocol
        electron_1.protocol.handle(config_1.config.security.protocols.app.scheme, async (request) => {
            const filePath = path_1.default.join(__dirname, '..', request.url.slice(`${config_1.config.security.protocols.app.scheme}://`.length));
            console.log('App protocol request:', filePath);
            return new Response(fs_1.default.readFileSync(filePath));
        });
    }
}
exports.ProtocolManager = ProtocolManager;
