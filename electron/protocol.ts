import { protocol } from 'electron';
import path from 'path';
import fs from 'fs';
import { config } from './config';

export class ProtocolManager {
  public static registerSchemes() {
    // Register schemes
    protocol.registerSchemesAsPrivileged([
      {
        scheme: config.security.protocols.exifhound.scheme,
        privileges: config.security.protocols.exifhound.privileges
      },
      {
        scheme: config.security.protocols.app.scheme,
        privileges: config.security.protocols.app.privileges
      }
    ]);
  }

  public static setupProtocols() {
    // Register file protocol
    protocol.registerFileProtocol('file', (request, callback) => {
      const filePath = decodeURIComponent(request.url.slice('file://'.length));
      console.log('File protocol request:', filePath);
      try {
        if (!fs.existsSync(filePath)) {
          console.error('File does not exist:', filePath);
          callback({ path: '' });
          return;
        }
        const stats = fs.statSync(filePath);
        console.log('File stats:', stats);
        callback({ path: filePath });
      } catch (error) {
        console.error('Error accessing file:', error);
        callback({ path: '' });
      }
    });

    // Register exifhound protocol
    protocol.registerFileProtocol(config.security.protocols.exifhound.scheme, (request, callback) => {
      const url = request.url.substr(`${config.security.protocols.exifhound.scheme}://`.length);
      const filePath = path.normalize(`${__dirname}/../${url}`);
      console.log('Exifhound protocol request:', filePath);
      callback({ path: filePath });
    });

    // Register app protocol
    protocol.handle(config.security.protocols.app.scheme, async (request) => {
      const filePath = path.join(__dirname, '..', request.url.slice(`${config.security.protocols.app.scheme}://`.length));
      console.log('App protocol request:', filePath);
      return new Response(fs.readFileSync(filePath));
    });
  }
} 