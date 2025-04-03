"use strict";
const electron = require("electron");
const fs = require("fs");
const path = require("path");
const config = {
  paths: {
    userData: path.join(electron.app.getPath("appData"), "Exif-Hound"),
    cache: path.join(electron.app.getPath("appData"), "Exif-Hound", "Cache")
  },
  window: {
    width: 1200,
    height: 800,
    titleBarStyle: "hiddenInset",
    backgroundColor: "#1a1a1a"
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
    ].join("; "),
    protocols: {
      exifhound: {
        scheme: "exifhound",
        privileges: {
          secure: true,
          standard: true,
          supportFetchAPI: true,
          allowServiceWorkers: true,
          corsEnabled: true
        }
      },
      app: {
        scheme: "app",
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
    images: ["jpg", "jpeg", "png", "gif", "webp"]
  }
};
class WindowManager {
  constructor() {
    this.mainWindow = null;
  }
  setupSession() {
    this.customSession = electron.session.fromPartition("persist:exifhound");
    this.customSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": config.security.csp
        }
      });
    });
  }
  createWindow() {
    if (this.mainWindow) {
      return this.mainWindow;
    }
    this.mainWindow = new electron.BrowserWindow({
      width: config.window.width,
      height: config.window.height,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: true,
        preload: path.join(__dirname, "preload.js"),
        session: this.customSession,
        devTools: process.env.NODE_ENV === "development"
      },
      titleBarStyle: config.window.titleBarStyle,
      backgroundColor: config.window.backgroundColor
    });
    if (process.platform === "win32") {
      require("electron").app.setAppUserModelId("com.exifhound.app");
    }
    this.loadContent();
    this.setupEventListeners();
    return this.mainWindow;
  }
  loadContent() {
    if (!this.mainWindow) return;
    if (process.env.VITE_DEV_SERVER_URL) {
      this.mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL).catch(console.error);
      if (process.env.OPEN_DEVTOOLS === "true") {
        this.mainWindow.webContents.openDevTools();
      }
    } else {
      this.mainWindow.loadFile(path.join(__dirname, "../dist/index.html")).catch(console.error);
    }
  }
  setupEventListeners() {
    if (!this.mainWindow) return;
    this.mainWindow.on("closed", () => {
      this.mainWindow = null;
    });
  }
  getMainWindow() {
    return this.mainWindow;
  }
  getSession() {
    return this.customSession;
  }
}
class ProtocolManager {
  static registerSchemes() {
    electron.protocol.registerSchemesAsPrivileged([
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
  static setupProtocols() {
    electron.protocol.registerFileProtocol("file", (request, callback) => {
      const filePath = decodeURIComponent(request.url.slice("file://".length));
      console.log("File protocol request:", filePath);
      try {
        if (!fs.existsSync(filePath)) {
          console.error("File does not exist:", filePath);
          callback({ path: "" });
          return;
        }
        const stats = fs.statSync(filePath);
        console.log("File stats:", stats);
        callback({ path: filePath });
      } catch (error) {
        console.error("Error accessing file:", error);
        callback({ path: "" });
      }
    });
    electron.protocol.registerFileProtocol(config.security.protocols.exifhound.scheme, (request, callback) => {
      const url = request.url.substr(`${config.security.protocols.exifhound.scheme}://`.length);
      const filePath = path.normalize(`${__dirname}/../${url}`);
      console.log("Exifhound protocol request:", filePath);
      callback({ path: filePath });
    });
    electron.protocol.handle(config.security.protocols.app.scheme, async (request) => {
      const filePath = path.join(__dirname, "..", request.url.slice(`${config.security.protocols.app.scheme}://`.length));
      console.log("App protocol request:", filePath);
      return new Response(fs.readFileSync(filePath));
    });
  }
}
let DataView$1 = class DataView2 {
  constructor(buffer) {
    if (bufferTypeIsUnsupported(buffer)) {
      throw new Error("DataView: Passed buffer type is unsupported.");
    }
    this.buffer = buffer;
    this.byteLength = this.buffer.length;
  }
  getUint8(offset) {
    return this.buffer.readUInt8(offset);
  }
  getUint16(offset, littleEndian) {
    if (littleEndian) {
      return this.buffer.readUInt16LE(offset);
    }
    return this.buffer.readUInt16BE(offset);
  }
  getUint32(offset, littleEndian) {
    if (littleEndian) {
      return this.buffer.readUInt32LE(offset);
    }
    return this.buffer.readUInt32BE(offset);
  }
  getInt32(offset, littleEndian) {
    if (littleEndian) {
      return this.buffer.readInt32LE(offset);
    }
    return this.buffer.readInt32BE(offset);
  }
};
function bufferTypeIsUnsupported(buffer) {
  return typeof buffer !== "object" || buffer.length === void 0 || buffer.readUInt8 === void 0 || buffer.readUInt16LE === void 0 || buffer.readUInt16BE === void 0 || buffer.readUInt32LE === void 0 || buffer.readUInt32BE === void 0 || buffer.readInt32LE === void 0 || buffer.readInt32BE === void 0;
}
function getDataView$1(data, byteOffset, byteLength) {
  try {
    return new DataView(data, byteOffset, byteLength);
  } catch (error) {
    return new DataView$1(data, byteOffset, byteLength);
  }
}
function getStringFromDataView(dataView, offset, length) {
  const chars = [];
  for (let i = 0; i < length && offset + i < dataView.byteLength; i++) {
    chars.push(dataView.getUint8(offset + i));
  }
  return getStringValueFromArray(chars);
}
function getNullTerminatedStringFromDataView(dataView, offset) {
  const chars = [];
  let i = 0;
  while (offset + i < dataView.byteLength) {
    const char = dataView.getUint8(offset + i);
    if (char === 0) {
      break;
    }
    chars.push(char);
    i++;
  }
  return getStringValueFromArray(chars);
}
function getUnicodeStringFromDataView(dataView, offset, length) {
  const chars = [];
  for (let i = 0; i < length && offset + i < dataView.byteLength; i += 2) {
    chars.push(dataView.getUint16(offset + i));
  }
  if (chars[chars.length - 1] === 0) {
    chars.pop();
  }
  return getStringValueFromArray(chars);
}
function getPascalStringFromDataView(dataView, offset) {
  const size = dataView.getUint8(offset);
  const string = getStringFromDataView(dataView, offset + 1, size);
  return [size, string];
}
function getStringValueFromArray(charArray) {
  return charArray.map((charCode) => String.fromCharCode(charCode)).join("");
}
function objectAssign() {
  for (let i = 1; i < arguments.length; i++) {
    for (const property in arguments[i]) {
      arguments[0][property] = arguments[i][property];
    }
  }
  return arguments[0];
}
function deferInit(object, key, initializer) {
  let initialized = false;
  Object.defineProperty(object, key, {
    get() {
      if (!initialized) {
        initialized = true;
        Object.defineProperty(object, key, {
          configurable: true,
          enumerable: true,
          value: initializer.apply(object),
          writable: true
        });
      }
      return object[key];
    },
    configurable: true,
    enumerable: true
  });
}
function getBase64Image(image) {
  if (typeof btoa !== "undefined") {
    if (typeof image === "string") {
      return btoa(image);
    }
    return btoa(Array.prototype.reduce.call(new Uint8Array(image), (data, byte) => data + String.fromCharCode(byte), ""));
  }
  if (typeof Buffer === "undefined") {
    return void 0;
  }
  if (typeof Buffer.from !== "undefined") {
    return Buffer.from(image).toString("base64");
  }
  return new Buffer(image).toString("base64");
}
function dataUriToBuffer(dataUri) {
  const data = dataUri.substring(dataUri.indexOf(",") + 1);
  if (dataUri.indexOf(";base64") !== -1) {
    if (typeof atob !== "undefined") {
      return Uint8Array.from(atob(data), (char) => char.charCodeAt(0)).buffer;
    }
    if (typeof Buffer === "undefined") {
      return void 0;
    }
    if (typeof Buffer.from !== "undefined") {
      return Buffer.from(data, "base64");
    }
    return new Buffer(data, "base64");
  }
  const decodedData = decodeURIComponent(data);
  if (typeof Buffer !== "undefined") {
    if (typeof Buffer.from !== "undefined") {
      return Buffer.from(decodedData);
    }
    return new Buffer(decodedData);
  }
  return Uint8Array.from(decodedData, (char) => char.charCodeAt(0)).buffer;
}
function padStart(string, length, character) {
  const padding = strRepeat(character, length - string.length);
  return padding + string;
}
function parseFloatRadix(string, radix) {
  return parseInt(string.replace(".", ""), radix) / Math.pow(radix, (string.split(".")[1] || "").length);
}
function strRepeat(string, num) {
  return new Array(num + 1).join(string);
}
const COMPRESSION_METHOD_NONE = void 0;
const COMPRESSION_METHOD_DEFLATE = 0;
function decompress(dataView, compressionMethod, encoding, returnType = "string") {
  if (compressionMethod === COMPRESSION_METHOD_DEFLATE) {
    if (typeof DecompressionStream === "function") {
      const decompressionStream = new DecompressionStream("deflate");
      const decompressedStream = new Blob([dataView]).stream().pipeThrough(decompressionStream);
      if (returnType === "dataview") {
        return new Response(decompressedStream).arrayBuffer().then((arrayBuffer) => new DataView(arrayBuffer));
      }
      return new Response(decompressedStream).arrayBuffer().then((buffer) => new TextDecoder(encoding).decode(buffer));
    }
  }
  if (compressionMethod !== void 0) {
    return Promise.reject(`Unknown compression method ${compressionMethod}.`);
  }
  return dataView;
}
const Constants = {
  USE_FILE: true,
  USE_JFIF: true,
  USE_PNG_FILE: true,
  USE_EXIF: true,
  USE_IPTC: true,
  USE_XMP: true,
  USE_ICC: true,
  USE_MPF: true,
  USE_PHOTOSHOP: true,
  USE_THUMBNAIL: true,
  USE_TIFF: true,
  USE_JPEG: true,
  USE_PNG: true,
  USE_HEIC: true,
  USE_AVIF: true,
  USE_WEBP: true,
  USE_GIF: true,
  USE_MAKER_NOTES: true
};
function getStringValue(value) {
  return value.map((charCode) => String.fromCharCode(charCode)).join("");
}
function getEncodedString(value) {
  if (value.length >= 8) {
    const encoding = getStringValue(value.slice(0, 8));
    if (encoding === "ASCII\0\0\0") {
      return getStringValue(value.slice(8));
    } else if (encoding === "JIS\0\0\0\0\0") {
      return "[JIS encoded text]";
    } else if (encoding === "UNICODE\0") {
      return "[Unicode encoded text]";
    } else if (encoding === "\0\0\0\0\0\0\0\0") {
      return "[Undefined encoding]";
    }
  }
  return "Undefined";
}
function getCalculatedGpsValue(value) {
  return value[0][0] / value[0][1] + value[1][0] / value[1][1] / 60 + value[2][0] / value[2][1] / 3600;
}
const LITTLE_ENDIAN = 18761;
const BIG_ENDIAN = 19789;
const ByteOrder = {
  BIG_ENDIAN,
  LITTLE_ENDIAN,
  getByteOrder
};
function getByteOrder(dataView, tiffHeaderOffset) {
  if (dataView.getUint16(tiffHeaderOffset) === LITTLE_ENDIAN) {
    return LITTLE_ENDIAN;
  } else if (dataView.getUint16(tiffHeaderOffset) === BIG_ENDIAN) {
    return BIG_ENDIAN;
  }
  throw new Error("Illegal byte order value. Faulty image.");
}
const Tiff = {
  isTiffFile,
  findTiffOffsets
};
function isTiffFile(dataView) {
  const MIN_TIFF_DATA_BUFFER_LENGTH = 4;
  return !!dataView && dataView.byteLength >= MIN_TIFF_DATA_BUFFER_LENGTH && hasTiffMarker(dataView);
}
function hasTiffMarker(dataView) {
  const TIFF_ID = 42;
  const TIFF_ID_OFFSET = 2;
  const littleEndian = dataView.getUint16(0) === ByteOrder.LITTLE_ENDIAN;
  return dataView.getUint16(TIFF_ID_OFFSET, littleEndian) === TIFF_ID;
}
function findTiffOffsets() {
  const TIFF_FILE_HEADER_OFFSET = 0;
  {
    return {
      hasAppMarkers: true,
      tiffHeaderOffset: TIFF_FILE_HEADER_OFFSET
    };
  }
}
const Jpeg = {
  isJpegFile,
  findJpegOffsets
};
const MIN_JPEG_DATA_BUFFER_LENGTH = 2;
const JPEG_ID = 65496;
const JPEG_ID_SIZE = 2;
const APP_ID_OFFSET = 4;
const APP_MARKER_SIZE = 2;
const JFIF_DATA_OFFSET = 2;
const TIFF_HEADER_OFFSET = 10;
const IPTC_DATA_OFFSET = 18;
const XMP_DATA_OFFSET = 33;
const XMP_EXTENDED_DATA_OFFSET = 79;
const APP2_ICC_DATA_OFFSET = 18;
const MPF_DATA_OFFSET = 8;
const APP2_ICC_IDENTIFIER = "ICC_PROFILE\0";
const ICC_CHUNK_NUMBER_OFFSET = APP_ID_OFFSET + APP2_ICC_IDENTIFIER.length;
const ICC_TOTAL_CHUNKS_OFFSET = ICC_CHUNK_NUMBER_OFFSET + 1;
const APP2_MPF_IDENTIFIER = "MPF\0";
const SOF0_MARKER = 65472;
const SOF2_MARKER = 65474;
const DHT_MARKER = 65476;
const DQT_MARKER = 65499;
const DRI_MARKER = 65501;
const SOS_MARKER = 65498;
const APP0_MARKER = 65504;
const APP1_MARKER = 65505;
const APP2_MARKER = 65506;
const APP13_MARKER = 65517;
const APP15_MARKER = 65519;
const COMMENT_MARKER = 65534;
const FILL_BYTE = 65535;
const APP0_JFIF_IDENTIFIER = "JFIF";
const APP1_EXIF_IDENTIFIER = "Exif";
const APP1_XMP_IDENTIFIER = "http://ns.adobe.com/xap/1.0/\0";
const APP1_XMP_EXTENDED_IDENTIFIER = "http://ns.adobe.com/xmp/extension/\0";
const APP13_IPTC_IDENTIFIER = "Photoshop 3.0";
function isJpegFile(dataView) {
  return !!dataView && dataView.byteLength >= MIN_JPEG_DATA_BUFFER_LENGTH && dataView.getUint16(0) === JPEG_ID;
}
function findJpegOffsets(dataView) {
  let appMarkerPosition = JPEG_ID_SIZE;
  let fieldLength;
  let sof0DataOffset;
  let sof2DataOffset;
  let jfifDataOffset;
  let tiffHeaderOffset;
  let iptcDataOffset;
  let xmpChunks;
  let iccChunks;
  let mpfDataOffset;
  while (appMarkerPosition + APP_ID_OFFSET + 5 <= dataView.byteLength) {
    if (isSOF0Marker(dataView, appMarkerPosition)) {
      fieldLength = dataView.getUint16(appMarkerPosition + APP_MARKER_SIZE);
      sof0DataOffset = appMarkerPosition + APP_MARKER_SIZE;
    } else if (isSOF2Marker(dataView, appMarkerPosition)) {
      fieldLength = dataView.getUint16(appMarkerPosition + APP_MARKER_SIZE);
      sof2DataOffset = appMarkerPosition + APP_MARKER_SIZE;
    } else if (isApp0JfifMarker(dataView, appMarkerPosition)) {
      fieldLength = dataView.getUint16(appMarkerPosition + APP_MARKER_SIZE);
      jfifDataOffset = appMarkerPosition + JFIF_DATA_OFFSET;
    } else if (isApp1ExifMarker(dataView, appMarkerPosition)) {
      fieldLength = dataView.getUint16(appMarkerPosition + APP_MARKER_SIZE);
      tiffHeaderOffset = appMarkerPosition + TIFF_HEADER_OFFSET;
    } else if (isApp1XmpMarker(dataView, appMarkerPosition)) {
      if (!xmpChunks) {
        xmpChunks = [];
      }
      fieldLength = dataView.getUint16(appMarkerPosition + APP_MARKER_SIZE);
      xmpChunks.push(getXmpChunkDetails(appMarkerPosition, fieldLength));
    } else if (isApp1ExtendedXmpMarker(dataView, appMarkerPosition)) {
      if (!xmpChunks) {
        xmpChunks = [];
      }
      fieldLength = dataView.getUint16(appMarkerPosition + APP_MARKER_SIZE);
      xmpChunks.push(getExtendedXmpChunkDetails(appMarkerPosition, fieldLength));
    } else if (isApp13PhotoshopMarker(dataView, appMarkerPosition)) {
      fieldLength = dataView.getUint16(appMarkerPosition + APP_MARKER_SIZE);
      iptcDataOffset = appMarkerPosition + IPTC_DATA_OFFSET;
    } else if (isApp2ICCMarker(dataView, appMarkerPosition)) {
      fieldLength = dataView.getUint16(appMarkerPosition + APP_MARKER_SIZE);
      const iccDataOffset = appMarkerPosition + APP2_ICC_DATA_OFFSET;
      const iccDataLength = fieldLength - (APP2_ICC_DATA_OFFSET - APP_MARKER_SIZE);
      const iccChunkNumber = dataView.getUint8(appMarkerPosition + ICC_CHUNK_NUMBER_OFFSET);
      const iccChunksTotal = dataView.getUint8(appMarkerPosition + ICC_TOTAL_CHUNKS_OFFSET);
      if (!iccChunks) {
        iccChunks = [];
      }
      iccChunks.push({ offset: iccDataOffset, length: iccDataLength, chunkNumber: iccChunkNumber, chunksTotal: iccChunksTotal });
    } else if (isApp2MPFMarker(dataView, appMarkerPosition)) {
      fieldLength = dataView.getUint16(appMarkerPosition + APP_MARKER_SIZE);
      mpfDataOffset = appMarkerPosition + MPF_DATA_OFFSET;
    } else if (isAppMarker(dataView, appMarkerPosition)) {
      fieldLength = dataView.getUint16(appMarkerPosition + APP_MARKER_SIZE);
    } else if (isFillByte(dataView, appMarkerPosition)) {
      appMarkerPosition++;
      continue;
    } else {
      break;
    }
    appMarkerPosition += APP_MARKER_SIZE + fieldLength;
  }
  return {
    hasAppMarkers: appMarkerPosition > JPEG_ID_SIZE,
    fileDataOffset: sof0DataOffset || sof2DataOffset,
    jfifDataOffset,
    tiffHeaderOffset,
    iptcDataOffset,
    xmpChunks,
    iccChunks,
    mpfDataOffset
  };
}
function isSOF0Marker(dataView, appMarkerPosition) {
  return dataView.getUint16(appMarkerPosition) === SOF0_MARKER;
}
function isSOF2Marker(dataView, appMarkerPosition) {
  return dataView.getUint16(appMarkerPosition) === SOF2_MARKER;
}
function isApp2ICCMarker(dataView, appMarkerPosition) {
  const markerIdLength = APP2_ICC_IDENTIFIER.length;
  return dataView.getUint16(appMarkerPosition) === APP2_MARKER && getStringFromDataView(dataView, appMarkerPosition + APP_ID_OFFSET, markerIdLength) === APP2_ICC_IDENTIFIER;
}
function isApp2MPFMarker(dataView, appMarkerPosition) {
  const markerIdLength = APP2_MPF_IDENTIFIER.length;
  return dataView.getUint16(appMarkerPosition) === APP2_MARKER && getStringFromDataView(dataView, appMarkerPosition + APP_ID_OFFSET, markerIdLength) === APP2_MPF_IDENTIFIER;
}
function isApp0JfifMarker(dataView, appMarkerPosition) {
  const markerIdLength = APP0_JFIF_IDENTIFIER.length;
  return dataView.getUint16(appMarkerPosition) === APP0_MARKER && getStringFromDataView(dataView, appMarkerPosition + APP_ID_OFFSET, markerIdLength) === APP0_JFIF_IDENTIFIER && dataView.getUint8(appMarkerPosition + APP_ID_OFFSET + markerIdLength) === 0;
}
function isApp1ExifMarker(dataView, appMarkerPosition) {
  const markerIdLength = APP1_EXIF_IDENTIFIER.length;
  return dataView.getUint16(appMarkerPosition) === APP1_MARKER && getStringFromDataView(dataView, appMarkerPosition + APP_ID_OFFSET, markerIdLength) === APP1_EXIF_IDENTIFIER && dataView.getUint8(appMarkerPosition + APP_ID_OFFSET + markerIdLength) === 0;
}
function isApp1XmpMarker(dataView, appMarkerPosition) {
  return dataView.getUint16(appMarkerPosition) === APP1_MARKER && isXmpIdentifier(dataView, appMarkerPosition);
}
function isXmpIdentifier(dataView, appMarkerPosition) {
  const markerIdLength = APP1_XMP_IDENTIFIER.length;
  return getStringFromDataView(dataView, appMarkerPosition + APP_ID_OFFSET, markerIdLength) === APP1_XMP_IDENTIFIER;
}
function isApp1ExtendedXmpMarker(dataView, appMarkerPosition) {
  return dataView.getUint16(appMarkerPosition) === APP1_MARKER && isExtendedXmpIdentifier(dataView, appMarkerPosition);
}
function isExtendedXmpIdentifier(dataView, appMarkerPosition) {
  const markerIdLength = APP1_XMP_EXTENDED_IDENTIFIER.length;
  return getStringFromDataView(dataView, appMarkerPosition + APP_ID_OFFSET, markerIdLength) === APP1_XMP_EXTENDED_IDENTIFIER;
}
function getXmpChunkDetails(appMarkerPosition, fieldLength) {
  return {
    dataOffset: appMarkerPosition + XMP_DATA_OFFSET,
    length: fieldLength - (XMP_DATA_OFFSET - APP_MARKER_SIZE)
  };
}
function getExtendedXmpChunkDetails(appMarkerPosition, fieldLength) {
  return {
    dataOffset: appMarkerPosition + XMP_EXTENDED_DATA_OFFSET,
    length: fieldLength - (XMP_EXTENDED_DATA_OFFSET - APP_MARKER_SIZE)
  };
}
function isApp13PhotoshopMarker(dataView, appMarkerPosition) {
  const markerIdLength = APP13_IPTC_IDENTIFIER.length;
  return dataView.getUint16(appMarkerPosition) === APP13_MARKER && getStringFromDataView(dataView, appMarkerPosition + APP_ID_OFFSET, markerIdLength) === APP13_IPTC_IDENTIFIER && dataView.getUint8(appMarkerPosition + APP_ID_OFFSET + markerIdLength) === 0;
}
function isAppMarker(dataView, appMarkerPosition) {
  const appMarker = dataView.getUint16(appMarkerPosition);
  return appMarker >= APP0_MARKER && appMarker <= APP15_MARKER || appMarker === COMMENT_MARKER || appMarker === SOF0_MARKER || appMarker === SOF2_MARKER || appMarker === DHT_MARKER || appMarker === DQT_MARKER || appMarker === DRI_MARKER || appMarker === SOS_MARKER;
}
function isFillByte(dataView, appMarkerPosition) {
  return dataView.getUint16(appMarkerPosition) === FILL_BYTE;
}
const Png = {
  isPngFile,
  findPngOffsets
};
const PNG_ID = "PNG\r\n\n";
const PNG_CHUNK_LENGTH_SIZE = 4;
const PNG_CHUNK_TYPE_SIZE = 4;
const PNG_CHUNK_LENGTH_OFFSET = 0;
const PNG_CHUNK_TYPE_OFFSET = PNG_CHUNK_LENGTH_SIZE;
const PNG_CHUNK_DATA_OFFSET = PNG_CHUNK_LENGTH_SIZE + PNG_CHUNK_TYPE_SIZE;
const PNG_XMP_PREFIX = "XML:com.adobe.xmp\0";
const TYPE_TEXT = "tEXt";
const TYPE_ITXT = "iTXt";
const TYPE_ZTXT = "zTXt";
const TYPE_PHYS = "pHYs";
const TYPE_TIME = "tIME";
const TYPE_EXIF = "eXIf";
const TYPE_ICCP = "iCCP";
function isPngFile(dataView) {
  return !!dataView && getStringFromDataView(dataView, 0, PNG_ID.length) === PNG_ID;
}
function findPngOffsets(dataView, async) {
  const PNG_CRC_SIZE = 4;
  const offsets = {
    hasAppMarkers: false
  };
  let offset = PNG_ID.length;
  while (offset + PNG_CHUNK_LENGTH_SIZE + PNG_CHUNK_TYPE_SIZE <= dataView.byteLength) {
    if (isPngImageHeaderChunk(dataView, offset)) {
      offsets.hasAppMarkers = true;
      offsets.pngHeaderOffset = offset + PNG_CHUNK_DATA_OFFSET;
    } else if (isPngXmpChunk(dataView, offset)) {
      const dataOffset = getPngXmpDataOffset(dataView, offset);
      if (dataOffset !== void 0) {
        offsets.hasAppMarkers = true;
        offsets.xmpChunks = [{
          dataOffset,
          length: dataView.getUint32(offset + PNG_CHUNK_LENGTH_OFFSET) - (dataOffset - (offset + PNG_CHUNK_DATA_OFFSET))
        }];
      }
    } else if (isPngTextChunk(dataView, offset, async)) {
      offsets.hasAppMarkers = true;
      const chunkType = getStringFromDataView(dataView, offset + PNG_CHUNK_TYPE_OFFSET, PNG_CHUNK_TYPE_SIZE);
      if (!offsets.pngTextChunks) {
        offsets.pngTextChunks = [];
      }
      offsets.pngTextChunks.push({
        length: dataView.getUint32(offset + PNG_CHUNK_LENGTH_OFFSET),
        type: chunkType,
        offset: offset + PNG_CHUNK_DATA_OFFSET
      });
    } else if (isPngExifChunk(dataView, offset)) {
      offsets.hasAppMarkers = true;
      offsets.tiffHeaderOffset = offset + PNG_CHUNK_DATA_OFFSET;
    } else if (async && isPngIccpChunk(dataView, offset)) {
      offsets.hasAppMarkers = true;
      const chunkDataLength = dataView.getUint32(offset + PNG_CHUNK_LENGTH_OFFSET);
      const iccHeaderOffset = offset + PNG_CHUNK_DATA_OFFSET;
      const { profileName, compressionMethod, compressedProfileOffset } = parseIccHeader(dataView, iccHeaderOffset);
      if (!offsets.iccChunks) {
        offsets.iccChunks = [];
      }
      offsets.iccChunks.push({
        offset: compressedProfileOffset,
        length: chunkDataLength - (compressedProfileOffset - iccHeaderOffset),
        chunkNumber: 1,
        chunksTotal: 1,
        profileName,
        compressionMethod
      });
    } else if (isPngChunk(dataView, offset)) {
      offsets.hasAppMarkers = true;
      if (!offsets.pngChunkOffsets) {
        offsets.pngChunkOffsets = [];
      }
      offsets.pngChunkOffsets.push(offset + PNG_CHUNK_LENGTH_OFFSET);
    }
    offset += dataView.getUint32(offset + PNG_CHUNK_LENGTH_OFFSET) + PNG_CHUNK_LENGTH_SIZE + PNG_CHUNK_TYPE_SIZE + PNG_CRC_SIZE;
  }
  return offsets;
}
function isPngImageHeaderChunk(dataView, offset) {
  const PNG_CHUNK_TYPE_IMAGE_HEADER = "IHDR";
  return getStringFromDataView(dataView, offset + PNG_CHUNK_TYPE_OFFSET, PNG_CHUNK_TYPE_SIZE) === PNG_CHUNK_TYPE_IMAGE_HEADER;
}
function isPngXmpChunk(dataView, offset) {
  return getStringFromDataView(dataView, offset + PNG_CHUNK_TYPE_OFFSET, PNG_CHUNK_TYPE_SIZE) === TYPE_ITXT && getStringFromDataView(dataView, offset + PNG_CHUNK_DATA_OFFSET, PNG_XMP_PREFIX.length) === PNG_XMP_PREFIX;
}
function isPngTextChunk(dataView, offset, async) {
  const chunkType = getStringFromDataView(dataView, offset + PNG_CHUNK_TYPE_OFFSET, PNG_CHUNK_TYPE_SIZE);
  return chunkType === TYPE_TEXT || chunkType === TYPE_ITXT || chunkType === TYPE_ZTXT && async;
}
function isPngExifChunk(dataView, offset) {
  return getStringFromDataView(dataView, offset + PNG_CHUNK_TYPE_OFFSET, PNG_CHUNK_TYPE_SIZE) === TYPE_EXIF;
}
function isPngIccpChunk(dataView, offset) {
  return getStringFromDataView(dataView, offset + PNG_CHUNK_TYPE_OFFSET, PNG_CHUNK_TYPE_SIZE) === TYPE_ICCP;
}
function isPngChunk(dataView, offset) {
  const SUPPORTED_PNG_CHUNK_TYPES = [TYPE_PHYS, TYPE_TIME];
  const chunkType = getStringFromDataView(dataView, offset + PNG_CHUNK_TYPE_OFFSET, PNG_CHUNK_TYPE_SIZE);
  return SUPPORTED_PNG_CHUNK_TYPES.includes(chunkType);
}
function getPngXmpDataOffset(dataView, offset) {
  const COMPRESSION_FLAG_SIZE = 1;
  const COMPRESSION_METHOD_SIZE = 1;
  offset += PNG_CHUNK_DATA_OFFSET + PNG_XMP_PREFIX.length + COMPRESSION_FLAG_SIZE + COMPRESSION_METHOD_SIZE;
  let numberOfNullSeparators = 0;
  while (numberOfNullSeparators < 2 && offset < dataView.byteLength) {
    if (dataView.getUint8(offset) === 0) {
      numberOfNullSeparators++;
    }
    offset++;
  }
  if (numberOfNullSeparators < 2) {
    return void 0;
  }
  return offset;
}
function parseIccHeader(dataView, offset) {
  const NULL_SEPARATOR_SIZE = 1;
  const COMPRESSION_METHOD_SIZE = 1;
  const profileName = getNullTerminatedStringFromDataView(dataView, offset);
  offset += profileName.length + NULL_SEPARATOR_SIZE;
  const compressionMethod = dataView.getUint8(offset);
  offset += COMPRESSION_METHOD_SIZE;
  return {
    profileName,
    compressionMethod,
    compressedProfileOffset: offset
  };
}
function get64BitValue(dataView, offset) {
  return dataView.getUint32(offset + 4);
}
function parseItemLocationBox(dataView, version, contentOffset, boxLength) {
  const FLAGS_SIZE = 3;
  const { offsets, sizes } = getItemLocationBoxOffsetsAndSizes(version, contentOffset + FLAGS_SIZE);
  const offsetSize = dataView.getUint8(offsets.offsetSize) >> 4;
  sizes.item.extent.extentOffset = offsetSize;
  const lengthSize = dataView.getUint8(offsets.lengthSize) & 15;
  sizes.item.extent.extentLength = lengthSize;
  const baseOffsetSize = dataView.getUint8(offsets.baseOffsetSize) >> 4;
  sizes.item.baseOffset = baseOffsetSize;
  const indexSize = getIndexSize(dataView, offsets.indexSize, version);
  sizes.item.extent.extentIndex = indexSize !== void 0 ? indexSize : 0;
  const itemCount = getItemCount(dataView, offsets.itemCount, version);
  return {
    type: "iloc",
    items: getItems(dataView, version, offsets, sizes, offsetSize, lengthSize, indexSize, itemCount),
    length: boxLength
  };
}
function getItemLocationBoxOffsetsAndSizes(version, contentOffset) {
  const sizes = {
    item: {
      dataReferenceIndex: 2,
      extentCount: 2,
      extent: {}
    }
  };
  if (version < 2) {
    sizes.itemCount = 2;
    sizes.item.itemId = 2;
  } else if (version === 2) {
    sizes.itemCount = 4;
    sizes.item.itemId = 4;
  }
  if (version === 1 || version === 2) {
    sizes.item.constructionMethod = 2;
  } else {
    sizes.item.constructionMethod = 0;
  }
  const offsets = {
    offsetSize: contentOffset,
    lengthSize: contentOffset,
    baseOffsetSize: contentOffset + 1,
    indexSize: contentOffset + 1
  };
  offsets.itemCount = contentOffset + 2;
  offsets.items = offsets.itemCount + sizes.itemCount;
  offsets.item = {
    itemId: 0
  };
  offsets.item.constructionMethod = offsets.item.itemId + sizes.item.itemId;
  offsets.item.dataReferenceIndex = offsets.item.constructionMethod + sizes.item.constructionMethod;
  return { offsets, sizes };
}
function getIndexSize(dataView, offset, version) {
  if (version === 1 || version === 2) {
    return dataView.getUint8(offset) & 15;
  }
  return void 0;
}
function getItemCount(dataView, offset, version) {
  if (version < 2) {
    return dataView.getUint16(offset);
  } else if (version === 2) {
    return dataView.getUint32(offset);
  }
  return void 0;
}
function getItems(dataView, version, offsets, sizes, offsetSize, lengthSize, indexSize, itemCount) {
  if (itemCount === void 0) {
    return [];
  }
  const items = [];
  let offset = offsets.items;
  for (let i = 0; i < itemCount; i++) {
    const item = { extents: [] };
    item.itemId = getItemId(dataView, offset, version);
    offset += sizes.item.itemId;
    item.constructionMethod = version === 1 || version === 2 ? dataView.getUint16(offset) & 15 : void 0;
    offset += sizes.item.constructionMethod;
    item.dataReferenceIndex = dataView.getUint16(offset);
    offset += sizes.item.dataReferenceIndex;
    item.baseOffset = getVariableSizedValue(dataView, offset, sizes.item.baseOffset);
    offset += sizes.item.baseOffset;
    item.extentCount = dataView.getUint16(offset);
    offset += sizes.item.extentCount;
    for (let j = 0; j < item.extentCount; j++) {
      const extent = {};
      extent.extentIndex = getExtentIndex(dataView, version, offset, indexSize);
      offset += sizes.item.extent.extentIndex;
      extent.extentOffset = getVariableSizedValue(dataView, offset, offsetSize);
      offset += sizes.item.extent.extentOffset;
      extent.extentLength = getVariableSizedValue(dataView, offset, lengthSize);
      offset += sizes.item.extent.extentLength;
      item.extents.push(extent);
    }
    items.push(item);
  }
  return items;
}
function getItemId(dataView, offset, version) {
  if (version < 2) {
    return dataView.getUint16(offset);
  } else if (version === 2) {
    return dataView.getUint32(offset);
  }
  return void 0;
}
function getExtentIndex(dataView, version, offset, indexSize) {
  if ((version === 1 || version === 2) && indexSize > 0) {
    return getVariableSizedValue(dataView, offset, indexSize);
  }
  return void 0;
}
function getVariableSizedValue(dataView, offset, size) {
  if (size === 4) {
    return dataView.getUint32(offset);
  }
  if (size === 8) {
    console.warn("This file uses an 8-bit offset which is currently not supported by ExifReader. Contact the maintainer to get it fixed.");
    return get64BitValue(dataView, offset);
  }
  return 0;
}
const TYPE_FTYP = 1718909296;
const TYPE_IPRP = 1768977008;
const TYPE_META = 1835365473;
const TYPE_ILOC = 1768714083;
const TYPE_IINF = 1768517222;
const TYPE_INFE = 1768842853;
const TYPE_IPCO = 1768973167;
const TYPE_COLR = 1668246642;
const ITEM_INFO_TYPE_EXIF = 1165519206;
const ITEM_INFO_TYPE_MIME = 1835625829;
const ITEM_INFO_TYPE_URI = 1970432288;
function parseBox(dataView, offset) {
  const BOX_TYPE_OFFSET = 4;
  const BOX_MIN_LENGTH = 8;
  const VERSION_SIZE = 1;
  const { length, contentOffset } = getBoxLength(dataView, offset);
  if (length < BOX_MIN_LENGTH) {
    return void 0;
  }
  const type = dataView.getUint32(offset + BOX_TYPE_OFFSET);
  if (type === TYPE_FTYP) {
    return parseFileTypeBox(dataView, contentOffset, length);
  }
  if (type === TYPE_IPRP) {
    return parseItemPropertiesBox(dataView, offset, contentOffset, length);
  }
  if (type === TYPE_IPCO) {
    return parseItemPropertyContainerBox(dataView, offset, contentOffset, length);
  }
  if (type === TYPE_COLR) {
    return parseColorInformationBox(dataView, contentOffset, length);
  }
  const version = dataView.getUint8(contentOffset);
  if (type === TYPE_META) {
    return parseMetadataBox(dataView, offset, contentOffset + VERSION_SIZE, length);
  }
  if (type === TYPE_ILOC) {
    return parseItemLocationBox(dataView, version, contentOffset + VERSION_SIZE, length);
  }
  if (type === TYPE_IINF) {
    return parseItemInformationBox(dataView, offset, version, contentOffset + VERSION_SIZE, length);
  }
  if (type === TYPE_INFE) {
    return parseItemInformationEntryBox(dataView, offset, version, contentOffset + VERSION_SIZE, length);
  }
  return {
    // type: getStringFromDataView(dataView, offset + BOX_TYPE_OFFSET, 4),
    type: void 0,
    length
  };
}
function getBoxLength(dataView, offset) {
  const BOX_LENGTH_SIZE = 4;
  const BOX_TYPE_SIZE = 4;
  const BOX_EXTENDED_SIZE = 8;
  const BOX_EXTENDED_SIZE_LOW_OFFSET = 12;
  const boxLength = dataView.getUint32(offset);
  if (extendsToEndOfFile(boxLength)) {
    return {
      length: dataView.byteLength - offset,
      contentOffset: offset + BOX_LENGTH_SIZE + BOX_TYPE_SIZE
    };
  }
  if (hasExtendedSize(boxLength)) {
    if (hasEmptyHighBits(dataView, offset)) {
      return {
        length: dataView.getUint32(offset + BOX_EXTENDED_SIZE_LOW_OFFSET),
        contentOffset: offset + BOX_LENGTH_SIZE + BOX_TYPE_SIZE + BOX_EXTENDED_SIZE
      };
    }
  }
  return {
    length: boxLength,
    contentOffset: offset + BOX_LENGTH_SIZE + BOX_TYPE_SIZE
  };
}
function extendsToEndOfFile(boxLength) {
  return boxLength === 0;
}
function hasExtendedSize(boxLength) {
  return boxLength === 1;
}
function hasEmptyHighBits(dataView, offset) {
  const BOX_EXTENDED_SIZE_OFFSET = 8;
  return dataView.getUint32(offset + BOX_EXTENDED_SIZE_OFFSET) === 0;
}
function findOffsets$3(dataView) {
  {
    const offsets = {};
    const metaBox = findMetaBox(dataView);
    if (!metaBox) {
      return { hasAppMarkers: false };
    }
    {
      offsets.tiffHeaderOffset = findExifOffset(dataView, metaBox);
    }
    {
      offsets.xmpChunks = findXmpChunks(metaBox);
    }
    {
      offsets.iccChunks = findIccChunks(metaBox);
    }
    offsets.hasAppMarkers = offsets.tiffHeaderOffset !== void 0 || offsets.xmpChunks !== void 0 || offsets.iccChunks !== void 0;
    return offsets;
  }
}
function findMetaBox(dataView) {
  const BOX_LENGTH_SIZE = 4;
  const BOX_TYPE_SIZE = 4;
  let offset = 0;
  while (offset + BOX_LENGTH_SIZE + BOX_TYPE_SIZE <= dataView.byteLength) {
    const box = parseBox(dataView, offset);
    if (box === void 0) {
      break;
    }
    if (box.type === "meta") {
      return box;
    }
    offset += box.length;
  }
  return void 0;
}
function findExifOffset(dataView, metaBox) {
  try {
    const exifItemId = findIinfExifItemId(metaBox).itemId;
    const ilocItem = findIlocItem(metaBox, exifItemId);
    const exifOffset = ilocItem.baseOffset + ilocItem.extents[0].extentOffset;
    return getTiffHeaderOffset(dataView, exifOffset);
  } catch (error) {
    return void 0;
  }
}
function findIinfExifItemId(metaBox) {
  return metaBox.subBoxes.find((box) => box.type === "iinf").itemInfos.find((itemInfo) => itemInfo.itemType === ITEM_INFO_TYPE_EXIF);
}
function findIlocItem(metaBox, itemId) {
  return metaBox.subBoxes.find((box) => box.type === "iloc").items.find((item) => item.itemId === itemId);
}
function getTiffHeaderOffset(dataView, exifOffset) {
  const TIFF_HEADER_OFFSET_SIZE = 4;
  return exifOffset + TIFF_HEADER_OFFSET_SIZE + dataView.getUint32(exifOffset);
}
function findXmpChunks(metaBox) {
  try {
    const xmpItemId = findIinfXmpItemId(metaBox).itemId;
    const ilocItem = findIlocItem(metaBox, xmpItemId);
    const ilocItemExtent = findIlocItem(metaBox, xmpItemId).extents[0];
    return [
      {
        dataOffset: ilocItem.baseOffset + ilocItemExtent.extentOffset,
        length: ilocItemExtent.extentLength
      }
    ];
  } catch (error) {
    return void 0;
  }
}
function findIinfXmpItemId(metaBox) {
  return metaBox.subBoxes.find((box) => box.type === "iinf").itemInfos.find((itemInfo) => itemInfo.itemType === ITEM_INFO_TYPE_MIME && itemInfo.contentType === "application/rdf+xml");
}
function findIccChunks(metaBox) {
  try {
    const icc = metaBox.subBoxes.find((box) => box.type === "iprp").subBoxes.find((box) => box.type === "ipco").properties.find((box) => box.type === "colr").icc;
    if (icc) {
      return [icc];
    }
  } catch (error) {
  }
  return void 0;
}
function parseFileTypeBox(dataView, contentOffset, boxLength) {
  const MAJOR_BRAND_SIZE = 4;
  const majorBrand = getStringFromDataView(dataView, contentOffset, MAJOR_BRAND_SIZE);
  return {
    type: "ftyp",
    majorBrand,
    length: boxLength
  };
}
function parseItemPropertiesBox(dataView, startOffset, contentOffset, length) {
  return {
    type: "iprp",
    subBoxes: parseSubBoxes(dataView, contentOffset, length - (contentOffset - startOffset)),
    length
  };
}
function parseItemPropertyContainerBox(dataView, startOffset, contentOffset, length) {
  return {
    type: "ipco",
    properties: parseSubBoxes(dataView, contentOffset, length - (contentOffset - startOffset)),
    length
  };
}
function parseColorInformationBox(dataView, contentOffset, length) {
  return {
    type: "colr",
    icc: parseIcc(dataView, contentOffset),
    length
  };
}
function parseIcc(dataView, contentOffset) {
  const COLOR_TYPE_SIZE = 4;
  const colorType = getStringFromDataView(dataView, contentOffset, COLOR_TYPE_SIZE);
  if (colorType !== "prof" && colorType !== "rICC") {
    return void 0;
  }
  return {
    offset: contentOffset + COLOR_TYPE_SIZE,
    length: dataView.getUint32(contentOffset + COLOR_TYPE_SIZE),
    chunkNumber: 1,
    chunksTotal: 1
  };
}
function parseMetadataBox(dataView, startOffset, contentOffset, length) {
  const FLAGS_SIZE = 3;
  return {
    type: "meta",
    subBoxes: parseSubBoxes(dataView, contentOffset + FLAGS_SIZE, length - (contentOffset + FLAGS_SIZE - startOffset)),
    length
  };
}
function parseSubBoxes(dataView, offset, length) {
  const ACCEPTED_ITEM_INFO_TYPES = [
    ITEM_INFO_TYPE_EXIF,
    ITEM_INFO_TYPE_MIME
  ];
  const subBoxes = [];
  let currentOffset = offset;
  while (currentOffset < offset + length) {
    const box = parseBox(dataView, currentOffset);
    if (box === void 0) {
      break;
    }
    if (box.type !== void 0 && (box.itemType === void 0 || ACCEPTED_ITEM_INFO_TYPES.indexOf(box.itemType) !== -1)) {
      subBoxes.push(box);
    }
    currentOffset += box.length;
  }
  return subBoxes;
}
function parseItemInformationBox(dataView, startOffset, version, contentOffset, length) {
  const { offsets } = getItemInformationBoxOffsetsAndSizes(version, contentOffset);
  return {
    type: "iinf",
    itemInfos: parseSubBoxes(dataView, offsets.itemInfos, length - (offsets.itemInfos - startOffset)),
    length
  };
}
function getItemInformationBoxOffsetsAndSizes(version, contentOffset) {
  const FLAGS_SIZE = 3;
  const offsets = { entryCount: contentOffset + FLAGS_SIZE };
  const sizes = {};
  if (version === 0) {
    sizes.entryCount = 2;
  } else {
    sizes.entryCount = 4;
  }
  offsets.itemInfos = offsets.entryCount + sizes.entryCount;
  return { offsets };
}
function parseItemInformationEntryBox(dataView, startOffset, version, contentOffset, length) {
  const FLAGS_SIZE = 3;
  contentOffset += FLAGS_SIZE;
  const entry = { type: "infe", length };
  if (version === 0 || version === 1) {
    entry.itemId = dataView.getUint16(contentOffset);
    contentOffset += 2;
    entry.itemProtectionIndex = dataView.getUint16(contentOffset);
    contentOffset += 2;
    entry.itemName = getNullTerminatedStringFromDataView(dataView, contentOffset);
    contentOffset += entry.itemName.length + 1;
  }
  if (version >= 2) {
    if (version === 2) {
      entry.itemId = dataView.getUint16(contentOffset);
      contentOffset += 2;
    } else if (version === 3) {
      entry.itemId = dataView.getUint32(contentOffset);
      contentOffset += 4;
    }
    entry.itemProtectionIndex = dataView.getUint16(contentOffset);
    contentOffset += 2;
    entry.itemType = dataView.getUint32(contentOffset);
    contentOffset += 4;
    entry.itemName = getNullTerminatedStringFromDataView(dataView, contentOffset);
    contentOffset += entry.itemName.length + 1;
    if (entry.itemType === ITEM_INFO_TYPE_MIME) {
      entry.contentType = getNullTerminatedStringFromDataView(dataView, contentOffset);
      contentOffset += entry.contentType.length + 1;
      if (startOffset + length > contentOffset) {
        entry.contentEncoding = getNullTerminatedStringFromDataView(dataView, contentOffset);
        contentOffset += entry.contentEncoding.length + 1;
      }
    } else if (entry.itemType === ITEM_INFO_TYPE_URI) {
      entry.itemUri = getNullTerminatedStringFromDataView(dataView, contentOffset);
      contentOffset += entry.itemUri.length + 1;
    }
  }
  return entry;
}
const Heic = {
  isHeicFile,
  findHeicOffsets
};
function isHeicFile(dataView) {
  if (!dataView) {
    return false;
  }
  const HEIC_MAJOR_BRANDS = ["heic", "heix", "hevc", "hevx", "heim", "heis", "hevm", "hevs", "mif1"];
  try {
    const headerBox = parseBox(dataView, 0);
    return headerBox && HEIC_MAJOR_BRANDS.indexOf(headerBox.majorBrand) !== -1;
  } catch (error) {
    return false;
  }
}
function findHeicOffsets(dataView) {
  return findOffsets$3(dataView);
}
const Avif = {
  isAvifFile,
  findAvifOffsets
};
function isAvifFile(dataView) {
  if (!dataView) {
    return false;
  }
  try {
    const headerBox = parseBox(dataView, 0);
    return headerBox && headerBox.majorBrand === "avif";
  } catch (error) {
    return false;
  }
}
function findAvifOffsets(dataView) {
  return findOffsets$3(dataView);
}
const Webp = {
  isWebpFile,
  findOffsets: findOffsets$2
};
function isWebpFile(dataView) {
  const RIFF_ID_OFFSET = 0;
  const RIFF_ID = "RIFF";
  const WEBP_MARKER_OFFSET = 8;
  const WEBP_MARKER = "WEBP";
  return !!dataView && getStringFromDataView(dataView, RIFF_ID_OFFSET, RIFF_ID.length) === RIFF_ID && getStringFromDataView(dataView, WEBP_MARKER_OFFSET, WEBP_MARKER.length) === WEBP_MARKER;
}
function findOffsets$2(dataView) {
  const SUB_CHUNK_START_OFFSET = 12;
  const CHUNK_SIZE_OFFSET = 4;
  const EXIF_IDENTIFIER = "Exif\0\0";
  const CHUNK_HEADER_SIZE = 8;
  let offset = SUB_CHUNK_START_OFFSET;
  let hasAppMarkers = false;
  let tiffHeaderOffset;
  let xmpChunks;
  let iccChunks;
  let vp8xChunkOffset;
  while (offset + CHUNK_HEADER_SIZE < dataView.byteLength) {
    const chunkId = getStringFromDataView(dataView, offset, 4);
    const chunkSize = dataView.getUint32(offset + CHUNK_SIZE_OFFSET, true);
    if (chunkId === "EXIF") {
      hasAppMarkers = true;
      if (getStringFromDataView(dataView, offset + CHUNK_HEADER_SIZE, EXIF_IDENTIFIER.length) === EXIF_IDENTIFIER) {
        tiffHeaderOffset = offset + CHUNK_HEADER_SIZE + EXIF_IDENTIFIER.length;
      } else {
        tiffHeaderOffset = offset + CHUNK_HEADER_SIZE;
      }
    } else if (chunkId === "XMP ") {
      hasAppMarkers = true;
      xmpChunks = [{
        dataOffset: offset + CHUNK_HEADER_SIZE,
        length: chunkSize
      }];
    } else if (chunkId === "ICCP") {
      hasAppMarkers = true;
      iccChunks = [{
        offset: offset + CHUNK_HEADER_SIZE,
        length: chunkSize,
        chunkNumber: 1,
        chunksTotal: 1
      }];
    } else if (chunkId === "VP8X") {
      hasAppMarkers = true;
      vp8xChunkOffset = offset + CHUNK_HEADER_SIZE;
    }
    offset += CHUNK_HEADER_SIZE + (chunkSize % 2 === 0 ? chunkSize : chunkSize + 1);
  }
  return {
    hasAppMarkers,
    tiffHeaderOffset,
    xmpChunks,
    iccChunks,
    vp8xChunkOffset
  };
}
const Gif = {
  isGifFile,
  findOffsets: findOffsets$1
};
const GIF_SIGNATURE_SIZE = 6;
const GIF_SIGNATURES = ["GIF87a", "GIF89a"];
function isGifFile(dataView) {
  return !!dataView && GIF_SIGNATURES.includes(getStringFromDataView(dataView, 0, GIF_SIGNATURE_SIZE));
}
function findOffsets$1() {
  return {
    gifHeaderOffset: 0
  };
}
const Xml = {
  isXMLFile,
  findOffsets
};
const XML_MARKER_OFFSET = 0;
const XML_MARKER = "<?xpacket begin";
function isXMLFile(dataView) {
  return !!dataView && getStringFromDataView(dataView, XML_MARKER_OFFSET, XML_MARKER.length) === XML_MARKER;
}
function findOffsets(dataView) {
  const xmpChunks = [];
  xmpChunks.push({ dataOffset: XML_MARKER_OFFSET, length: dataView.byteLength });
  return {
    xmpChunks
  };
}
const ImageHeader = {
  parseAppMarkers
};
function parseAppMarkers(dataView, async) {
  if (Tiff.isTiffFile(dataView)) {
    return addFileType(Tiff.findTiffOffsets(), "tiff", "TIFF");
  }
  if (Jpeg.isJpegFile(dataView)) {
    return addFileType(Jpeg.findJpegOffsets(dataView), "jpeg", "JPEG");
  }
  if (Png.isPngFile(dataView)) {
    return addFileType(Png.findPngOffsets(dataView, async), "png", "PNG");
  }
  if (Heic.isHeicFile(dataView)) {
    return addFileType(Heic.findHeicOffsets(dataView), "heic", "HEIC");
  }
  if (Avif.isAvifFile(dataView)) {
    return addFileType(Avif.findAvifOffsets(dataView), "avif", "AVIF");
  }
  if (Webp.isWebpFile(dataView)) {
    return addFileType(Webp.findOffsets(dataView), "webp", "WebP");
  }
  if (Gif.isGifFile(dataView)) {
    return addFileType(Gif.findOffsets(dataView), "gif", "GIF");
  }
  if (Xml.isXMLFile(dataView)) {
    return addFileType(Xml.findOffsets(dataView), "xml", "XML");
  }
  throw new Error("Invalid image format");
}
function addFileType(offsets, fileType, fileTypeDescription) {
  return objectAssign({}, offsets, { fileType: { value: fileType, description: fileTypeDescription } });
}
const TagNamesCommon = {
  ApertureValue: (value) => Math.pow(Math.sqrt(2), value[0] / value[1]).toFixed(2),
  ColorSpace(value) {
    if (value === 1) {
      return "sRGB";
    } else if (value === 65535) {
      return "Uncalibrated";
    }
    return "Unknown";
  },
  ComponentsConfiguration(value) {
    return value.map((character) => {
      if (character === 49) {
        return "Y";
      } else if (character === 50) {
        return "Cb";
      } else if (character === 51) {
        return "Cr";
      } else if (character === 52) {
        return "R";
      } else if (character === 53) {
        return "G";
      } else if (character === 54) {
        return "B";
      }
    }).join("");
  },
  Contrast(value) {
    if (value === 0) {
      return "Normal";
    } else if (value === 1) {
      return "Soft";
    } else if (value === 2) {
      return "Hard";
    }
    return "Unknown";
  },
  CustomRendered(value) {
    if (value === 0) {
      return "Normal process";
    } else if (value === 1) {
      return "Custom process";
    }
    return "Unknown";
  },
  ExposureMode(value) {
    if (value === 0) {
      return "Auto exposure";
    } else if (value === 1) {
      return "Manual exposure";
    } else if (value === 2) {
      return "Auto bracket";
    }
    return "Unknown";
  },
  ExposureProgram(value) {
    if (value === 0) {
      return "Undefined";
    } else if (value === 1) {
      return "Manual";
    } else if (value === 2) {
      return "Normal program";
    } else if (value === 3) {
      return "Aperture priority";
    } else if (value === 4) {
      return "Shutter priority";
    } else if (value === 5) {
      return "Creative program";
    } else if (value === 6) {
      return "Action program";
    } else if (value === 7) {
      return "Portrait mode";
    } else if (value === 8) {
      return "Landscape mode";
    } else if (value === 9) {
      return "Bulb";
    }
    return "Unknown";
  },
  ExposureTime(value) {
    if (value[0] / value[1] > 0.25) {
      const decimal = value[0] / value[1];
      if (Number.isInteger(decimal)) {
        return "" + decimal;
      }
      return decimal.toFixed(1);
    }
    if (value[0] !== 0) {
      return `1/${Math.round(value[1] / value[0])}`;
    }
    return `0/${value[1]}`;
  },
  FNumber: (value) => `f/${value[0] / value[1]}`,
  FocalLength: (value) => value[0] / value[1] + " mm",
  FocalPlaneResolutionUnit(value) {
    if (value === 2) {
      return "inches";
    } else if (value === 3) {
      return "centimeters";
    }
    return "Unknown";
  },
  LightSource: (value) => {
    if (value === 1) {
      return "Daylight";
    } else if (value === 2) {
      return "Fluorescent";
    } else if (value === 3) {
      return "Tungsten (incandescent light)";
    } else if (value === 4) {
      return "Flash";
    } else if (value === 9) {
      return "Fine weather";
    } else if (value === 10) {
      return "Cloudy weather";
    } else if (value === 11) {
      return "Shade";
    } else if (value === 12) {
      return "Daylight fluorescent (D 5700 – 7100K)";
    } else if (value === 13) {
      return "Day white fluorescent (N 4600 – 5400K)";
    } else if (value === 14) {
      return "Cool white fluorescent (W 3900 – 4500K)";
    } else if (value === 15) {
      return "White fluorescent (WW 3200 – 3700K)";
    } else if (value === 17) {
      return "Standard light A";
    } else if (value === 18) {
      return "Standard light B";
    } else if (value === 19) {
      return "Standard light C";
    } else if (value === 20) {
      return "D55";
    } else if (value === 21) {
      return "D65";
    } else if (value === 22) {
      return "D75";
    } else if (value === 23) {
      return "D50";
    } else if (value === 24) {
      return "ISO studio tungsten";
    } else if (value === 255) {
      return "Other light source";
    }
    return "Unknown";
  },
  MeteringMode(value) {
    if (value === 1) {
      return "Average";
    } else if (value === 2) {
      return "CenterWeightedAverage";
    } else if (value === 3) {
      return "Spot";
    } else if (value === 4) {
      return "MultiSpot";
    } else if (value === 5) {
      return "Pattern";
    } else if (value === 6) {
      return "Partial";
    } else if (value === 255) {
      return "Other";
    }
    return "Unknown";
  },
  ResolutionUnit(value) {
    if (value === 2) {
      return "inches";
    }
    if (value === 3) {
      return "centimeters";
    }
    return "Unknown";
  },
  Saturation(value) {
    if (value === 0) {
      return "Normal";
    } else if (value === 1) {
      return "Low saturation";
    } else if (value === 2) {
      return "High saturation";
    }
    return "Unknown";
  },
  SceneCaptureType(value) {
    if (value === 0) {
      return "Standard";
    } else if (value === 1) {
      return "Landscape";
    } else if (value === 2) {
      return "Portrait";
    } else if (value === 3) {
      return "Night scene";
    }
    return "Unknown";
  },
  Sharpness(value) {
    if (value === 0) {
      return "Normal";
    } else if (value === 1) {
      return "Soft";
    } else if (value === 2) {
      return "Hard";
    }
    return "Unknown";
  },
  ShutterSpeedValue(value) {
    const denominator = Math.pow(2, value[0] / value[1]);
    if (denominator <= 1) {
      return `${Math.round(1 / denominator)}`;
    }
    return `1/${Math.round(denominator)}`;
  },
  WhiteBalance(value) {
    if (value === 0) {
      return "Auto white balance";
    } else if (value === 1) {
      return "Manual white balance";
    }
    return "Unknown";
  },
  XResolution: (value) => "" + Math.round(value[0] / value[1]),
  YResolution: (value) => "" + Math.round(value[0] / value[1])
};
const TagNames0thIfd = {
  11: "ProcessingSoftware",
  254: {
    name: "SubfileType",
    description: (value) => ({
      0: "Full-resolution image",
      1: "Reduced-resolution image",
      2: "Single page of multi-page image",
      3: "Single page of multi-page reduced-resolution image",
      4: "Transparency mask",
      5: "Transparency mask of reduced-resolution image",
      6: "Transparency mask of multi-page image",
      7: "Transparency mask of reduced-resolution multi-page image",
      65537: "Alternate reduced-resolution image",
      4294967295: "Invalid"
    })[value] || "Unknown"
  },
  255: {
    name: "OldSubfileType",
    description: (value) => ({
      0: "Full-resolution image",
      1: "Reduced-resolution image",
      2: "Single page of multi-page image"
    })[value] || "Unknown"
  },
  256: "ImageWidth",
  257: "ImageLength",
  258: "BitsPerSample",
  259: "Compression",
  262: "PhotometricInterpretation",
  263: {
    name: "Thresholding",
    description: (value) => ({
      1: "No dithering or halftoning",
      2: "Ordered dither or halfton",
      3: "Randomized dither"
    })[value] || "Unknown"
  },
  264: "CellWidth",
  265: "CellLength",
  266: {
    name: "FillOrder",
    description: (value) => ({
      1: "Normal",
      2: "Reversed"
    })[value] || "Unknown"
  },
  269: "DocumentName",
  270: "ImageDescription",
  271: "Make",
  272: "Model",
  273: "StripOffsets",
  274: {
    name: "Orientation",
    description: (value) => {
      if (value === 1) {
        return "top-left";
      }
      if (value === 2) {
        return "top-right";
      }
      if (value === 3) {
        return "bottom-right";
      }
      if (value === 4) {
        return "bottom-left";
      }
      if (value === 5) {
        return "left-top";
      }
      if (value === 6) {
        return "right-top";
      }
      if (value === 7) {
        return "right-bottom";
      }
      if (value === 8) {
        return "left-bottom";
      }
      return "Undefined";
    }
  },
  277: "SamplesPerPixel",
  278: "RowsPerStrip",
  279: "StripByteCounts",
  280: "MinSampleValue",
  281: "MaxSampleValue",
  282: {
    "name": "XResolution",
    "description": TagNamesCommon.XResolution
  },
  283: {
    "name": "YResolution",
    "description": TagNamesCommon.YResolution
  },
  284: "PlanarConfiguration",
  285: "PageName",
  286: {
    "name": "XPosition",
    "description": (value) => {
      return "" + Math.round(value[0] / value[1]);
    }
  },
  287: {
    "name": "YPosition",
    "description": (value) => {
      return "" + Math.round(value[0] / value[1]);
    }
  },
  290: {
    name: "GrayResponseUnit",
    description: (value) => ({
      1: "0.1",
      2: "0.001",
      3: "0.0001",
      4: "1e-05",
      5: "1e-06"
    })[value] || "Unknown"
  },
  296: {
    name: "ResolutionUnit",
    description: TagNamesCommon.ResolutionUnit
  },
  297: "PageNumber",
  301: "TransferFunction",
  305: "Software",
  306: "DateTime",
  315: "Artist",
  316: "HostComputer",
  317: "Predictor",
  318: {
    "name": "WhitePoint",
    "description": (values) => {
      return values.map((value) => `${value[0]}/${value[1]}`).join(", ");
    }
  },
  319: {
    "name": "PrimaryChromaticities",
    "description": (values) => {
      return values.map((value) => `${value[0]}/${value[1]}`).join(", ");
    }
  },
  321: "HalftoneHints",
  322: "TileWidth",
  323: "TileLength",
  330: "A100DataOffset",
  332: {
    name: "InkSet",
    description: (value) => ({
      1: "CMYK",
      2: "Not CMYK"
    })[value] || "Unknown"
  },
  337: "TargetPrinter",
  338: {
    name: "ExtraSamples",
    description: (value) => ({
      0: "Unspecified",
      1: "Associated Alpha",
      2: "Unassociated Alpha"
    })[value] || "Unknown"
  },
  339: {
    name: "SampleFormat",
    description: (value) => {
      const formats = {
        1: "Unsigned",
        2: "Signed",
        3: "Float",
        4: "Undefined",
        5: "Complex int",
        6: "Complex float"
      };
      if (!Array.isArray(value)) {
        return "Unknown";
      }
      return value.map((sample) => formats[sample] || "Unknown").join(", ");
    }
  },
  513: "JPEGInterchangeFormat",
  514: "JPEGInterchangeFormatLength",
  529: {
    "name": "YCbCrCoefficients",
    "description": (values) => {
      return values.map((value) => "" + value[0] / value[1]).join("/");
    }
  },
  530: "YCbCrSubSampling",
  531: {
    name: "YCbCrPositioning",
    description: (value) => {
      if (value === 1) {
        return "centered";
      }
      if (value === 2) {
        return "co-sited";
      }
      return "undefined " + value;
    }
  },
  532: {
    "name": "ReferenceBlackWhite",
    "description": (values) => {
      return values.map((value) => "" + value[0] / value[1]).join(", ");
    }
  },
  700: "ApplicationNotes",
  18246: "Rating",
  18249: "RatingPercent",
  33432: {
    name: "Copyright",
    description: (value) => value.join("; ")
  },
  33550: "PixelScale",
  33723: "IPTC-NAA",
  33920: "IntergraphMatrix",
  33922: "ModelTiePoint",
  34118: "SEMInfo",
  34264: "ModelTransform",
  34377: "PhotoshopSettings",
  34665: "Exif IFD Pointer",
  34675: "ICC_Profile",
  34735: "GeoTiffDirectory",
  34736: "GeoTiffDoubleParams",
  34737: "GeoTiffAsciiParams",
  34853: "GPS Info IFD Pointer",
  40091: {
    name: "XPTitle",
    description: decodeXPValue
  },
  40092: {
    name: "XPComment",
    description: decodeXPValue
  },
  40093: {
    name: "XPAuthor",
    description: decodeXPValue
  },
  40094: {
    name: "XPKeywords",
    description: decodeXPValue
  },
  40095: {
    name: "XPSubject",
    description: decodeXPValue
  },
  42112: "GDALMetadata",
  42113: "GDALNoData",
  50341: "PrintIM",
  50707: "DNGBackwardVersion",
  50708: "UniqueCameraModel",
  50709: "LocalizedCameraModel",
  50721: "ColorMatrix1",
  50722: "ColorMatrix2",
  50723: "CameraCalibration1",
  50724: "CameraCalibration2",
  50725: "ReductionMatrix1",
  50726: "ReductionMatrix2",
  50727: "AnalogBalance",
  50728: "AsShotNeutral",
  50729: "AsShotWhiteXY",
  50730: "BaselineExposure",
  50731: "BaselineNoise",
  50732: "BaselineSharpness",
  50734: "LinearResponseLimit",
  50735: "CameraSerialNumber",
  50736: "DNGLensInfo",
  50739: "ShadowScale",
  50741: {
    name: "MakerNoteSafety",
    description: (value) => ({
      0: "Unsafe",
      1: "Safe"
    })[value] || "Unknown"
  },
  50778: {
    name: "CalibrationIlluminant1",
    description: TagNamesCommon["LightSource"]
  },
  50779: {
    name: "CalibrationIlluminant2",
    description: TagNamesCommon["LightSource"]
  },
  50781: "RawDataUniqueID",
  50827: "OriginalRawFileName",
  50828: "OriginalRawFileData",
  50831: "AsShotICCProfile",
  50832: "AsShotPreProfileMatrix",
  50833: "CurrentICCProfile",
  50834: "CurrentPreProfileMatrix",
  50879: "ColorimetricReference",
  50885: "SRawType",
  50898: "PanasonicTitle",
  50899: "PanasonicTitle2",
  50931: "CameraCalibrationSig",
  50932: "ProfileCalibrationSig",
  50933: "ProfileIFD",
  50934: "AsShotProfileName",
  50936: "ProfileName",
  50937: "ProfileHueSatMapDims",
  50938: "ProfileHueSatMapData1",
  50939: "ProfileHueSatMapData2",
  50940: "ProfileToneCurve",
  50941: {
    name: "ProfileEmbedPolicy",
    description: (value) => ({
      0: "Allow Copying",
      1: "Embed if Used",
      2: "Never Embed",
      3: "No Restrictions"
    })[value] || "Unknown"
  },
  50942: "ProfileCopyright",
  50964: "ForwardMatrix1",
  50965: "ForwardMatrix2",
  50966: "PreviewApplicationName",
  50967: "PreviewApplicationVersion",
  50968: "PreviewSettingsName",
  50969: "PreviewSettingsDigest",
  50970: {
    name: "PreviewColorSpace",
    description: (value) => ({
      1: "Gray Gamma 2.2",
      2: "sRGB",
      3: "Adobe RGB",
      4: "ProPhoto RGB"
    })[value] || "Unknown"
  },
  50971: "PreviewDateTime",
  50972: "RawImageDigest",
  50973: "OriginalRawFileDigest",
  50981: "ProfileLookTableDims",
  50982: "ProfileLookTableData",
  51043: "TimeCodes",
  51044: "FrameRate",
  51058: "TStop",
  51081: "ReelName",
  51089: "OriginalDefaultFinalSize",
  51090: "OriginalBestQualitySize",
  51091: "OriginalDefaultCropSize",
  51105: "CameraLabel",
  51107: {
    name: "ProfileHueSatMapEncoding",
    description: (value) => ({
      0: "Linear",
      1: "sRGB"
    })[value] || "Unknown"
  },
  51108: {
    name: "ProfileLookTableEncoding",
    description: (value) => ({
      0: "Linear",
      1: "sRGB"
    })[value] || "Unknown"
  },
  51109: "BaselineExposureOffset",
  51110: {
    name: "DefaultBlackRender",
    description: (value) => ({
      0: "Auto",
      1: "None"
    })[value] || "Unknown"
  },
  51111: "NewRawImageDigest",
  51112: "RawToPreviewGain"
};
function decodeXPValue(value) {
  const decodedValue = new TextDecoder("utf-16").decode(new Uint8Array(value));
  return decodedValue.replace(/\u0000+$/, "");
}
const TagNamesExifIfd = {
  33434: {
    "name": "ExposureTime",
    "description": TagNamesCommon.ExposureTime
  },
  33437: {
    "name": "FNumber",
    "description": TagNamesCommon.FNumber
  },
  34850: {
    "name": "ExposureProgram",
    "description": TagNamesCommon.ExposureProgram
  },
  34852: "SpectralSensitivity",
  34855: "ISOSpeedRatings",
  34856: {
    "name": "OECF",
    "description": () => "[Raw OECF table data]"
  },
  34858: "TimeZoneOffset",
  34859: "SelfTimerMode",
  34864: {
    name: "SensitivityType",
    description: (value) => ({
      1: "Standard Output Sensitivity",
      2: "Recommended Exposure Index",
      3: "ISO Speed",
      4: "Standard Output Sensitivity and Recommended Exposure Index",
      5: "Standard Output Sensitivity and ISO Speed",
      6: "Recommended Exposure Index and ISO Speed",
      7: "Standard Output Sensitivity, Recommended Exposure Index and ISO Speed"
    })[value] || "Unknown"
  },
  34865: "StandardOutputSensitivity",
  34866: "RecommendedExposureIndex",
  34867: "ISOSpeed",
  34868: "ISOSpeedLatitudeyyy",
  34869: "ISOSpeedLatitudezzz",
  36864: {
    "name": "ExifVersion",
    "description": (value) => getStringValue(value)
  },
  36867: "DateTimeOriginal",
  36868: "DateTimeDigitized",
  36873: "GooglePlusUploadCode",
  36880: "OffsetTime",
  36881: "OffsetTimeOriginal",
  36882: "OffsetTimeDigitized",
  37121: {
    "name": "ComponentsConfiguration",
    "description": TagNamesCommon.ComponentsConfiguration
  },
  37122: "CompressedBitsPerPixel",
  37377: {
    "name": "ShutterSpeedValue",
    "description": TagNamesCommon.ShutterSpeedValue
  },
  37378: {
    "name": "ApertureValue",
    "description": TagNamesCommon.ApertureValue
  },
  37379: "BrightnessValue",
  37380: "ExposureBiasValue",
  37381: {
    "name": "MaxApertureValue",
    "description": (value) => {
      return Math.pow(Math.sqrt(2), value[0] / value[1]).toFixed(2);
    }
  },
  37382: {
    "name": "SubjectDistance",
    "description": (value) => value[0] / value[1] + " m"
  },
  37383: {
    "name": "MeteringMode",
    "description": TagNamesCommon.MeteringMode
  },
  37384: {
    "name": "LightSource",
    description: TagNamesCommon.LightSource
  },
  37385: {
    "name": "Flash",
    "description": (value) => {
      if (value === 0) {
        return "Flash did not fire";
      } else if (value === 1) {
        return "Flash fired";
      } else if (value === 5) {
        return "Strobe return light not detected";
      } else if (value === 7) {
        return "Strobe return light detected";
      } else if (value === 9) {
        return "Flash fired, compulsory flash mode";
      } else if (value === 13) {
        return "Flash fired, compulsory flash mode, return light not detected";
      } else if (value === 15) {
        return "Flash fired, compulsory flash mode, return light detected";
      } else if (value === 16) {
        return "Flash did not fire, compulsory flash mode";
      } else if (value === 24) {
        return "Flash did not fire, auto mode";
      } else if (value === 25) {
        return "Flash fired, auto mode";
      } else if (value === 29) {
        return "Flash fired, auto mode, return light not detected";
      } else if (value === 31) {
        return "Flash fired, auto mode, return light detected";
      } else if (value === 32) {
        return "No flash function";
      } else if (value === 65) {
        return "Flash fired, red-eye reduction mode";
      } else if (value === 69) {
        return "Flash fired, red-eye reduction mode, return light not detected";
      } else if (value === 71) {
        return "Flash fired, red-eye reduction mode, return light detected";
      } else if (value === 73) {
        return "Flash fired, compulsory flash mode, red-eye reduction mode";
      } else if (value === 77) {
        return "Flash fired, compulsory flash mode, red-eye reduction mode, return light not detected";
      } else if (value === 79) {
        return "Flash fired, compulsory flash mode, red-eye reduction mode, return light detected";
      } else if (value === 89) {
        return "Flash fired, auto mode, red-eye reduction mode";
      } else if (value === 93) {
        return "Flash fired, auto mode, return light not detected, red-eye reduction mode";
      } else if (value === 95) {
        return "Flash fired, auto mode, return light detected, red-eye reduction mode";
      }
      return "Unknown";
    }
  },
  37386: {
    "name": "FocalLength",
    "description": TagNamesCommon.FocalLength
  },
  37393: "ImageNumber",
  37394: {
    name: "SecurityClassification",
    description: (value) => ({
      "C": "Confidential",
      "R": "Restricted",
      "S": "Secret",
      "T": "Top Secret",
      "U": "Unclassified"
    })[value] || "Unknown"
  },
  37395: "ImageHistory",
  37396: {
    "name": "SubjectArea",
    "description": (value) => {
      if (value.length === 2) {
        return `Location; X: ${value[0]}, Y: ${value[1]}`;
      } else if (value.length === 3) {
        return `Circle; X: ${value[0]}, Y: ${value[1]}, diameter: ${value[2]}`;
      } else if (value.length === 4) {
        return `Rectangle; X: ${value[0]}, Y: ${value[1]}, width: ${value[2]}, height: ${value[3]}`;
      }
      return "Unknown";
    }
  },
  37500: {
    "name": "MakerNote",
    "description": () => "[Raw maker note data]"
  },
  37510: {
    "name": "UserComment",
    "description": getEncodedString
  },
  37520: "SubSecTime",
  37521: "SubSecTimeOriginal",
  37522: "SubSecTimeDigitized",
  37724: "ImageSourceData",
  37888: {
    "name": "AmbientTemperature",
    "description": (value) => value[0] / value[1] + " °C"
  },
  37889: {
    "name": "Humidity",
    "description": (value) => value[0] / value[1] + " %"
  },
  37890: {
    "name": "Pressure",
    "description": (value) => value[0] / value[1] + " hPa"
  },
  37891: {
    "name": "WaterDepth",
    "description": (value) => value[0] / value[1] + " m"
  },
  37892: {
    "name": "Acceleration",
    "description": (value) => value[0] / value[1] + " mGal"
  },
  37893: {
    "name": "CameraElevationAngle",
    "description": (value) => value[0] / value[1] + " °"
  },
  40960: {
    "name": "FlashpixVersion",
    "description": (value) => value.map((charCode) => String.fromCharCode(charCode)).join("")
  },
  40961: {
    "name": "ColorSpace",
    "description": TagNamesCommon.ColorSpace
  },
  40962: "PixelXDimension",
  40963: "PixelYDimension",
  40964: "RelatedSoundFile",
  40965: "Interoperability IFD Pointer",
  41483: "FlashEnergy",
  41484: {
    "name": "SpatialFrequencyResponse",
    "description": () => "[Raw SFR table data]"
  },
  41486: "FocalPlaneXResolution",
  41487: "FocalPlaneYResolution",
  41488: {
    "name": "FocalPlaneResolutionUnit",
    "description": TagNamesCommon.FocalPlaneResolutionUnit
  },
  41492: {
    "name": "SubjectLocation",
    "description": ([x, y]) => `X: ${x}, Y: ${y}`
  },
  41493: "ExposureIndex",
  41495: {
    "name": "SensingMethod",
    "description": (value) => {
      if (value === 1) {
        return "Undefined";
      } else if (value === 2) {
        return "One-chip color area sensor";
      } else if (value === 3) {
        return "Two-chip color area sensor";
      } else if (value === 4) {
        return "Three-chip color area sensor";
      } else if (value === 5) {
        return "Color sequential area sensor";
      } else if (value === 7) {
        return "Trilinear sensor";
      } else if (value === 8) {
        return "Color sequential linear sensor";
      }
      return "Unknown";
    }
  },
  41728: {
    "name": "FileSource",
    "description": (value) => {
      if (value === 3) {
        return "DSC";
      }
      return "Unknown";
    }
  },
  41729: {
    "name": "SceneType",
    "description": (value) => {
      if (value === 1) {
        return "A directly photographed image";
      }
      return "Unknown";
    }
  },
  41730: {
    "name": "CFAPattern",
    "description": () => "[Raw CFA pattern table data]"
  },
  41985: {
    "name": "CustomRendered",
    "description": TagNamesCommon.CustomRendered
  },
  41986: {
    "name": "ExposureMode",
    "description": TagNamesCommon.ExposureMode
  },
  41987: {
    "name": "WhiteBalance",
    "description": TagNamesCommon.WhiteBalance
  },
  41988: {
    "name": "DigitalZoomRatio",
    "description": (value) => {
      if (value[0] === 0) {
        return "Digital zoom was not used";
      }
      return "" + value[0] / value[1];
    }
  },
  41989: {
    "name": "FocalLengthIn35mmFilm",
    "description": (value) => {
      if (value === 0) {
        return "Unknown";
      }
      return value;
    }
  },
  41990: {
    "name": "SceneCaptureType",
    "description": TagNamesCommon.SceneCaptureType
  },
  41991: {
    "name": "GainControl",
    "description": (value) => {
      if (value === 0) {
        return "None";
      } else if (value === 1) {
        return "Low gain up";
      } else if (value === 2) {
        return "High gain up";
      } else if (value === 3) {
        return "Low gain down";
      } else if (value === 4) {
        return "High gain down";
      }
      return "Unknown";
    }
  },
  41992: {
    "name": "Contrast",
    "description": TagNamesCommon.Contrast
  },
  41993: {
    "name": "Saturation",
    "description": TagNamesCommon.Saturation
  },
  41994: {
    "name": "Sharpness",
    "description": TagNamesCommon.Sharpness
  },
  41995: {
    "name": "DeviceSettingDescription",
    "description": () => "[Raw device settings table data]"
  },
  41996: {
    "name": "SubjectDistanceRange",
    "description": (value) => {
      if (value === 1) {
        return "Macro";
      } else if (value === 2) {
        return "Close view";
      } else if (value === 3) {
        return "Distant view";
      }
      return "Unknown";
    }
  },
  42016: "ImageUniqueID",
  42032: "CameraOwnerName",
  42033: "BodySerialNumber",
  42034: {
    "name": "LensSpecification",
    "description": (value) => {
      const focalLengthFrom = parseFloat((value[0][0] / value[0][1]).toFixed(5));
      const focalLengthTo = parseFloat((value[1][0] / value[1][1]).toFixed(5));
      const focalLengths = `${focalLengthFrom}-${focalLengthTo} mm`;
      if (value[3][1] === 0) {
        return `${focalLengths} f/?`;
      }
      const maxAperture = 1 / (value[2][1] / value[2][1] / (value[3][0] / value[3][1]));
      return `${focalLengths} f/${parseFloat(maxAperture.toFixed(5))}`;
    }
  },
  42035: "LensMake",
  42036: "LensModel",
  42037: "LensSerialNumber",
  42080: {
    name: "CompositeImage",
    description: (value) => ({
      1: "Not a Composite Image",
      2: "General Composite Image",
      3: "Composite Image Captured While Shooting"
    })[value] || "Unknown"
  },
  42081: "SourceImageNumberOfCompositeImage",
  42082: "SourceExposureTimesOfCompositeImage",
  42240: "Gamma",
  59932: "Padding",
  59933: "OffsetSchema",
  65e3: "OwnerName",
  65001: "SerialNumber",
  65002: "Lens",
  65100: "RawFile",
  65101: "Converter",
  65102: "WhiteBalance",
  65105: "Exposure",
  65106: "Shadows",
  65107: "Brightness",
  65108: "Contrast",
  65109: "Saturation",
  65110: "Sharpness",
  65111: "Smoothness",
  65112: "MoireFilter"
};
const TagNamesGpsIfd = {
  0: {
    "name": "GPSVersionID",
    "description": (value) => {
      if (value[0] === 2 && value[1] === 2 && value[2] === 0 && value[3] === 0) {
        return "Version 2.2";
      }
      return "Unknown";
    }
  },
  1: {
    "name": "GPSLatitudeRef",
    "description": (value) => {
      const ref = value.join("");
      if (ref === "N") {
        return "North latitude";
      } else if (ref === "S") {
        return "South latitude";
      }
      return "Unknown";
    }
  },
  2: {
    "name": "GPSLatitude",
    "description": getCalculatedGpsValue
  },
  3: {
    "name": "GPSLongitudeRef",
    "description": (value) => {
      const ref = value.join("");
      if (ref === "E") {
        return "East longitude";
      } else if (ref === "W") {
        return "West longitude";
      }
      return "Unknown";
    }
  },
  4: {
    "name": "GPSLongitude",
    "description": getCalculatedGpsValue
  },
  5: {
    "name": "GPSAltitudeRef",
    "description": (value) => {
      if (value === 0) {
        return "Sea level";
      } else if (value === 1) {
        return "Sea level reference (negative value)";
      }
      return "Unknown";
    }
  },
  6: {
    "name": "GPSAltitude",
    "description": (value) => {
      return value[0] / value[1] + " m";
    }
  },
  7: {
    "name": "GPSTimeStamp",
    "description": (values) => {
      return values.map(([numerator, denominator]) => {
        const num = numerator / denominator;
        if (/^\d(\.|$)/.test(`${num}`)) {
          return `0${num}`;
        }
        return num;
      }).join(":");
    }
  },
  8: "GPSSatellites",
  9: {
    "name": "GPSStatus",
    "description": (value) => {
      const status = value.join("");
      if (status === "A") {
        return "Measurement in progress";
      } else if (status === "V") {
        return "Measurement Interoperability";
      }
      return "Unknown";
    }
  },
  10: {
    "name": "GPSMeasureMode",
    "description": (value) => {
      const mode = value.join("");
      if (mode === "2") {
        return "2-dimensional measurement";
      } else if (mode === "3") {
        return "3-dimensional measurement";
      }
      return "Unknown";
    }
  },
  11: "GPSDOP",
  12: {
    "name": "GPSSpeedRef",
    "description": (value) => {
      const ref = value.join("");
      if (ref === "K") {
        return "Kilometers per hour";
      } else if (ref === "M") {
        return "Miles per hour";
      } else if (ref === "N") {
        return "Knots";
      }
      return "Unknown";
    }
  },
  13: "GPSSpeed",
  14: {
    "name": "GPSTrackRef",
    "description": (value) => {
      const ref = value.join("");
      if (ref === "T") {
        return "True direction";
      } else if (ref === "M") {
        return "Magnetic direction";
      }
      return "Unknown";
    }
  },
  15: "GPSTrack",
  16: {
    "name": "GPSImgDirectionRef",
    "description": (value) => {
      const ref = value.join("");
      if (ref === "T") {
        return "True direction";
      } else if (ref === "M") {
        return "Magnetic direction";
      }
      return "Unknown";
    }
  },
  17: "GPSImgDirection",
  18: "GPSMapDatum",
  19: {
    "name": "GPSDestLatitudeRef",
    "description": (value) => {
      const ref = value.join("");
      if (ref === "N") {
        return "North latitude";
      } else if (ref === "S") {
        return "South latitude";
      }
      return "Unknown";
    }
  },
  20: {
    "name": "GPSDestLatitude",
    "description": (value) => {
      return value[0][0] / value[0][1] + value[1][0] / value[1][1] / 60 + value[2][0] / value[2][1] / 3600;
    }
  },
  21: {
    "name": "GPSDestLongitudeRef",
    "description": (value) => {
      const ref = value.join("");
      if (ref === "E") {
        return "East longitude";
      } else if (ref === "W") {
        return "West longitude";
      }
      return "Unknown";
    }
  },
  22: {
    "name": "GPSDestLongitude",
    "description": (value) => {
      return value[0][0] / value[0][1] + value[1][0] / value[1][1] / 60 + value[2][0] / value[2][1] / 3600;
    }
  },
  23: {
    "name": "GPSDestBearingRef",
    "description": (value) => {
      const ref = value.join("");
      if (ref === "T") {
        return "True direction";
      } else if (ref === "M") {
        return "Magnetic direction";
      }
      return "Unknown";
    }
  },
  24: "GPSDestBearing",
  25: {
    "name": "GPSDestDistanceRef",
    "description": (value) => {
      const ref = value.join("");
      if (ref === "K") {
        return "Kilometers";
      } else if (ref === "M") {
        return "Miles";
      } else if (ref === "N") {
        return "Knots";
      }
      return "Unknown";
    }
  },
  26: "GPSDestDistance",
  27: {
    "name": "GPSProcessingMethod",
    "description": getEncodedString
  },
  28: {
    "name": "GPSAreaInformation",
    "description": getEncodedString
  },
  29: "GPSDateStamp",
  30: {
    "name": "GPSDifferential",
    "description": (value) => {
      if (value === 0) {
        return "Measurement without differential correction";
      } else if (value === 1) {
        return "Differential correction applied";
      }
      return "Unknown";
    }
  },
  31: "GPSHPositioningError"
};
const TagNamesInteroperabilityIfd = {
  1: "InteroperabilityIndex",
  2: {
    name: "InteroperabilityVersion",
    description: (value) => getStringValue(value)
  },
  4096: "RelatedImageFileFormat",
  4097: "RelatedImageWidth",
  4098: "RelatedImageHeight"
};
const TagNamesMpfIfd = {
  45056: {
    "name": "MPFVersion",
    "description": (value) => getStringValue(value)
  },
  45057: "NumberOfImages",
  45058: "MPEntry",
  45059: "ImageUIDList",
  45060: "TotalFrames"
};
const TagNamesCanonIfd = {
  4: {
    "name": "ShotInfo",
    "description": (value) => value
  }
};
const tagNames0thExifIfds = objectAssign({}, TagNames0thIfd, TagNamesExifIfd);
const IFD_TYPE_0TH = "0th";
const IFD_TYPE_1ST = "1st";
const IFD_TYPE_EXIF = "exif";
const IFD_TYPE_GPS = "gps";
const IFD_TYPE_INTEROPERABILITY = "interoperability";
const IFD_TYPE_MPF = "mpf";
const IFD_TYPE_CANON = "canon";
const TagNames$1 = {
  [IFD_TYPE_0TH]: tagNames0thExifIfds,
  [IFD_TYPE_1ST]: TagNames0thIfd,
  [IFD_TYPE_EXIF]: tagNames0thExifIfds,
  [IFD_TYPE_GPS]: TagNamesGpsIfd,
  [IFD_TYPE_INTEROPERABILITY]: TagNamesInteroperabilityIfd,
  [IFD_TYPE_MPF]: TagNamesMpfIfd,
  [IFD_TYPE_CANON]: TagNamesCanonIfd
};
const typeSizes = {
  1: 1,
  // BYTE
  2: 1,
  // ASCII
  3: 2,
  // SHORT
  4: 4,
  // LONG
  5: 8,
  // RATIONAL
  7: 1,
  // UNDEFINED
  9: 4,
  // SLONG
  10: 8,
  // SRATIONAL
  13: 4
  // IFD
};
const tagTypes = {
  "BYTE": 1,
  "ASCII": 2,
  "SHORT": 3,
  "LONG": 4,
  "RATIONAL": 5,
  "UNDEFINED": 7,
  "SLONG": 9,
  "SRATIONAL": 10,
  "IFD": 13
};
const Types = {
  getAsciiValue,
  getByteAt,
  getAsciiAt,
  getShortAt,
  getLongAt,
  getRationalAt,
  getUndefinedAt,
  getSlongAt,
  getSrationalAt,
  getIfdPointerAt,
  typeSizes,
  tagTypes,
  getTypeSize
};
function getAsciiValue(charArray) {
  return charArray.map((charCode) => String.fromCharCode(charCode));
}
function getByteAt(dataView, offset) {
  return dataView.getUint8(offset);
}
function getAsciiAt(dataView, offset) {
  return dataView.getUint8(offset);
}
function getShortAt(dataView, offset, byteOrder) {
  return dataView.getUint16(offset, byteOrder === ByteOrder.LITTLE_ENDIAN);
}
function getLongAt(dataView, offset, byteOrder) {
  return dataView.getUint32(offset, byteOrder === ByteOrder.LITTLE_ENDIAN);
}
function getRationalAt(dataView, offset, byteOrder) {
  return [getLongAt(dataView, offset, byteOrder), getLongAt(dataView, offset + 4, byteOrder)];
}
function getUndefinedAt(dataView, offset) {
  return getByteAt(dataView, offset);
}
function getSlongAt(dataView, offset, byteOrder) {
  return dataView.getInt32(offset, byteOrder === ByteOrder.LITTLE_ENDIAN);
}
function getSrationalAt(dataView, offset, byteOrder) {
  return [getSlongAt(dataView, offset, byteOrder), getSlongAt(dataView, offset + 4, byteOrder)];
}
function getIfdPointerAt(dataView, offset, byteOrder) {
  return getLongAt(dataView, offset, byteOrder);
}
function getTypeSize(typeName) {
  if (tagTypes[typeName] === void 0) {
    throw new Error("No such type found.");
  }
  return typeSizes[tagTypes[typeName]];
}
const getTagValueAt = {
  1: Types.getByteAt,
  2: Types.getAsciiAt,
  3: Types.getShortAt,
  4: Types.getLongAt,
  5: Types.getRationalAt,
  7: Types.getUndefinedAt,
  9: Types.getSlongAt,
  10: Types.getSrationalAt,
  13: Types.getIfdPointerAt
};
function get0thIfdOffset(dataView, tiffHeaderOffset, byteOrder) {
  return tiffHeaderOffset + Types.getLongAt(dataView, tiffHeaderOffset + 4, byteOrder);
}
function readIfd(dataView, ifdType, tiffHeaderOffset, offset, byteOrder, includeUnknown) {
  const FIELD_COUNT_SIZE = Types.getTypeSize("SHORT");
  const FIELD_SIZE = 12;
  const tags = {};
  const numberOfFields = getNumberOfFields(dataView, offset, byteOrder);
  offset += FIELD_COUNT_SIZE;
  for (let fieldIndex = 0; fieldIndex < numberOfFields; fieldIndex++) {
    if (offset + FIELD_SIZE > dataView.byteLength) {
      break;
    }
    const tag = readTag$1(dataView, ifdType, tiffHeaderOffset, offset, byteOrder, includeUnknown);
    if (tag !== void 0) {
      tags[tag.name] = {
        "id": tag.id,
        "value": tag.value,
        "description": tag.description
      };
      if (tag.name === "MakerNote") {
        tags[tag.name].__offset = tag.__offset;
      }
    }
    offset += FIELD_SIZE;
  }
  if (offset < dataView.byteLength - Types.getTypeSize("LONG")) {
    const nextIfdOffset = Types.getLongAt(dataView, offset, byteOrder);
    if (nextIfdOffset !== 0 && ifdType === IFD_TYPE_0TH) {
      tags["Thumbnail"] = readIfd(dataView, IFD_TYPE_1ST, tiffHeaderOffset, tiffHeaderOffset + nextIfdOffset, byteOrder, includeUnknown);
    }
  }
  return tags;
}
function getNumberOfFields(dataView, offset, byteOrder) {
  if (offset + Types.getTypeSize("SHORT") <= dataView.byteLength) {
    return Types.getShortAt(dataView, offset, byteOrder);
  }
  return 0;
}
function readTag$1(dataView, ifdType, tiffHeaderOffset, offset, byteOrder, includeUnknown) {
  const TAG_CODE_IPTC_NAA = 33723;
  const TAG_TYPE_OFFSET = Types.getTypeSize("SHORT");
  const TAG_COUNT_OFFSET = TAG_TYPE_OFFSET + Types.getTypeSize("SHORT");
  const TAG_VALUE_OFFSET = TAG_COUNT_OFFSET + Types.getTypeSize("LONG");
  const tagCode = Types.getShortAt(dataView, offset, byteOrder);
  const tagType = Types.getShortAt(dataView, offset + TAG_TYPE_OFFSET, byteOrder);
  const tagCount = Types.getLongAt(dataView, offset + TAG_COUNT_OFFSET, byteOrder);
  let tagValue;
  let tagValueOffset;
  if (Types.typeSizes[tagType] === void 0 || !includeUnknown && TagNames$1[ifdType][tagCode] === void 0) {
    return void 0;
  }
  if (tagValueFitsInOffsetSlot(tagType, tagCount)) {
    tagValueOffset = offset + TAG_VALUE_OFFSET;
    tagValue = getTagValue$1(dataView, tagValueOffset, tagType, tagCount, byteOrder);
  } else {
    tagValueOffset = Types.getLongAt(dataView, offset + TAG_VALUE_OFFSET, byteOrder);
    if (tagValueFitsInDataView(dataView, tiffHeaderOffset, tagValueOffset, tagType, tagCount)) {
      const forceByteType = tagCode === TAG_CODE_IPTC_NAA;
      tagValue = getTagValue$1(dataView, tiffHeaderOffset + tagValueOffset, tagType, tagCount, byteOrder, forceByteType);
    } else {
      tagValue = "<faulty value>";
    }
  }
  if (tagType === Types.tagTypes["ASCII"]) {
    tagValue = splitNullSeparatedAsciiString(tagValue);
    tagValue = decodeAsciiValue$1(tagValue);
  }
  let tagName = `undefined-${tagCode}`;
  let tagDescription = tagValue;
  if (TagNames$1[ifdType][tagCode] !== void 0) {
    if (TagNames$1[ifdType][tagCode]["name"] !== void 0 && TagNames$1[ifdType][tagCode]["description"] !== void 0) {
      tagName = TagNames$1[ifdType][tagCode]["name"];
      try {
        tagDescription = TagNames$1[ifdType][tagCode]["description"](tagValue);
      } catch (error) {
        tagDescription = getDescriptionFromTagValue(tagValue);
      }
    } else if (tagType === Types.tagTypes["RATIONAL"] || tagType === Types.tagTypes["SRATIONAL"]) {
      tagName = TagNames$1[ifdType][tagCode];
      tagDescription = "" + tagValue[0] / tagValue[1];
    } else {
      tagName = TagNames$1[ifdType][tagCode];
      tagDescription = getDescriptionFromTagValue(tagValue);
    }
  }
  return {
    id: tagCode,
    name: tagName,
    value: tagValue,
    description: tagDescription,
    __offset: tagValueOffset
  };
}
function tagValueFitsInOffsetSlot(tagType, tagCount) {
  return Types.typeSizes[tagType] * tagCount <= Types.getTypeSize("LONG");
}
function getTagValue$1(dataView, offset, type, count, byteOrder, forceByteType = false) {
  let value = [];
  if (forceByteType) {
    count = count * Types.typeSizes[type];
    type = Types.tagTypes["BYTE"];
  }
  for (let valueIndex = 0; valueIndex < count; valueIndex++) {
    value.push(getTagValueAt[type](dataView, offset, byteOrder));
    offset += Types.typeSizes[type];
  }
  if (type === Types.tagTypes["ASCII"]) {
    value = Types.getAsciiValue(value);
  } else if (value.length === 1) {
    value = value[0];
  }
  return value;
}
function tagValueFitsInDataView(dataView, tiffHeaderOffset, tagValueOffset, tagType, tagCount) {
  return tiffHeaderOffset + tagValueOffset + Types.typeSizes[tagType] * tagCount <= dataView.byteLength;
}
function splitNullSeparatedAsciiString(string) {
  const tagValue = [];
  let i = 0;
  for (let j = 0; j < string.length; j++) {
    if (string[j] === "\0") {
      i++;
      continue;
    }
    if (tagValue[i] === void 0) {
      tagValue[i] = "";
    }
    tagValue[i] += string[j];
  }
  return tagValue;
}
function decodeAsciiValue$1(asciiValue) {
  try {
    return asciiValue.map((value) => decodeURIComponent(escape(value)));
  } catch (error) {
    return asciiValue;
  }
}
function getDescriptionFromTagValue(tagValue) {
  if (tagValue instanceof Array) {
    return tagValue.join(", ");
  }
  return tagValue;
}
const EXIF_IFD_POINTER_KEY = "Exif IFD Pointer";
const GPS_INFO_IFD_POINTER_KEY = "GPS Info IFD Pointer";
const INTEROPERABILITY_IFD_POINTER_KEY = "Interoperability IFD Pointer";
const Tags = {
  read: read$d
};
function read$d(dataView, tiffHeaderOffset, includeUnknown) {
  const byteOrder = ByteOrder.getByteOrder(dataView, tiffHeaderOffset);
  let tags = read0thIfd(dataView, tiffHeaderOffset, byteOrder, includeUnknown);
  tags = readExifIfd(tags, dataView, tiffHeaderOffset, byteOrder, includeUnknown);
  tags = readGpsIfd(tags, dataView, tiffHeaderOffset, byteOrder, includeUnknown);
  tags = readInteroperabilityIfd(tags, dataView, tiffHeaderOffset, byteOrder, includeUnknown);
  return { tags, byteOrder };
}
function read0thIfd(dataView, tiffHeaderOffset, byteOrder, includeUnknown) {
  return readIfd(dataView, IFD_TYPE_0TH, tiffHeaderOffset, get0thIfdOffset(dataView, tiffHeaderOffset, byteOrder), byteOrder, includeUnknown);
}
function readExifIfd(tags, dataView, tiffHeaderOffset, byteOrder, includeUnknown) {
  if (tags[EXIF_IFD_POINTER_KEY] !== void 0) {
    return objectAssign(tags, readIfd(dataView, IFD_TYPE_EXIF, tiffHeaderOffset, tiffHeaderOffset + tags[EXIF_IFD_POINTER_KEY].value, byteOrder, includeUnknown));
  }
  return tags;
}
function readGpsIfd(tags, dataView, tiffHeaderOffset, byteOrder, includeUnknown) {
  if (tags[GPS_INFO_IFD_POINTER_KEY] !== void 0) {
    return objectAssign(tags, readIfd(dataView, IFD_TYPE_GPS, tiffHeaderOffset, tiffHeaderOffset + tags[GPS_INFO_IFD_POINTER_KEY].value, byteOrder, includeUnknown));
  }
  return tags;
}
function readInteroperabilityIfd(tags, dataView, tiffHeaderOffset, byteOrder, includeUnknown) {
  if (tags[INTEROPERABILITY_IFD_POINTER_KEY] !== void 0) {
    return objectAssign(tags, readIfd(dataView, IFD_TYPE_INTEROPERABILITY, tiffHeaderOffset, tiffHeaderOffset + tags[INTEROPERABILITY_IFD_POINTER_KEY].value, byteOrder, includeUnknown));
  }
  return tags;
}
const MpfTags = {
  read: read$c
};
const ENTRY_SIZE = 16;
function read$c(dataView, dataOffset, includeUnknown) {
  const byteOrder = ByteOrder.getByteOrder(dataView, dataOffset);
  const tags = readIfd(dataView, IFD_TYPE_MPF, dataOffset, get0thIfdOffset(dataView, dataOffset, byteOrder), byteOrder, includeUnknown);
  return addMpfImages(dataView, dataOffset, tags, byteOrder);
}
function addMpfImages(dataView, dataOffset, tags, byteOrder) {
  if (!tags["MPEntry"]) {
    return tags;
  }
  const images = [];
  for (let i = 0; i < Math.ceil(tags["MPEntry"].value.length / ENTRY_SIZE); i++) {
    images[i] = {};
    const attributes = getImageNumberValue(tags["MPEntry"].value, i * ENTRY_SIZE, Types.getTypeSize("LONG"), byteOrder);
    images[i]["ImageFlags"] = getImageFlags(attributes);
    images[i]["ImageFormat"] = getImageFormat(attributes);
    images[i]["ImageType"] = getImageType(attributes);
    const imageSize = getImageNumberValue(tags["MPEntry"].value, i * ENTRY_SIZE + 4, Types.getTypeSize("LONG"), byteOrder);
    images[i]["ImageSize"] = {
      value: imageSize,
      description: "" + imageSize
    };
    const imageOffset = getImageOffset(i, tags["MPEntry"], byteOrder, dataOffset);
    images[i]["ImageOffset"] = {
      value: imageOffset,
      description: "" + imageOffset
    };
    const dependentImage1EntryNumber = getImageNumberValue(tags["MPEntry"].value, i * ENTRY_SIZE + 12, Types.getTypeSize("SHORT"), byteOrder);
    images[i]["DependentImage1EntryNumber"] = {
      value: dependentImage1EntryNumber,
      description: "" + dependentImage1EntryNumber
    };
    const dependentImage2EntryNumber = getImageNumberValue(tags["MPEntry"].value, i * ENTRY_SIZE + 14, Types.getTypeSize("SHORT"), byteOrder);
    images[i]["DependentImage2EntryNumber"] = {
      value: dependentImage2EntryNumber,
      description: "" + dependentImage2EntryNumber
    };
    images[i].image = dataView.buffer.slice(imageOffset, imageOffset + imageSize);
    deferInit(images[i], "base64", function() {
      return getBase64Image(this.image);
    });
  }
  tags["Images"] = images;
  return tags;
}
function getImageNumberValue(entries, offset, size, byteOrder) {
  if (byteOrder === ByteOrder.LITTLE_ENDIAN) {
    let value2 = 0;
    for (let i = 0; i < size; i++) {
      value2 += entries[offset + i] << 8 * i;
    }
    return value2;
  }
  let value = 0;
  for (let i = 0; i < size; i++) {
    value += entries[offset + i] << 8 * (size - 1 - i);
  }
  return value;
}
function getImageFlags(attributes) {
  const flags = [
    attributes >> 31 & 1,
    attributes >> 30 & 1,
    attributes >> 29 & 1
  ];
  const flagsDescription = [];
  if (flags[0]) {
    flagsDescription.push("Dependent Parent Image");
  }
  if (flags[1]) {
    flagsDescription.push("Dependent Child Image");
  }
  if (flags[2]) {
    flagsDescription.push("Representative Image");
  }
  return {
    value: flags,
    description: flagsDescription.join(", ") || "None"
  };
}
function getImageFormat(attributes) {
  const imageFormat = attributes >> 24 & 7;
  return {
    value: imageFormat,
    description: imageFormat === 0 ? "JPEG" : "Unknown"
  };
}
function getImageType(attributes) {
  const type = attributes & 16777215;
  const descriptions = {
    196608: "Baseline MP Primary Image",
    65537: "Large Thumbnail (VGA equivalent)",
    65538: "Large Thumbnail (Full HD equivalent)",
    131073: "Multi-Frame Image (Panorama)",
    131074: "Multi-Frame Image (Disparity)",
    131075: "Multi-Frame Image (Multi-Angle)",
    0: "Undefined"
  };
  return {
    value: type,
    description: descriptions[type] || "Unknown"
  };
}
function getImageOffset(imageIndex, mpEntry, byteOrder, dataOffset) {
  if (isFirstIndividualImage(imageIndex)) {
    return 0;
  }
  return getImageNumberValue(mpEntry.value, imageIndex * ENTRY_SIZE + 8, Types.getTypeSize("LONG"), byteOrder) + dataOffset;
}
function isFirstIndividualImage(imageIndex) {
  return imageIndex === 0;
}
const FileTags = {
  read: read$b
};
function read$b(dataView, fileDataOffset) {
  const length = getLength$1(dataView, fileDataOffset);
  const numberOfColorComponents = getNumberOfColorComponents(dataView, fileDataOffset, length);
  return {
    "Bits Per Sample": getDataPrecision(dataView, fileDataOffset, length),
    "Image Height": getImageHeight$2(dataView, fileDataOffset, length),
    "Image Width": getImageWidth$2(dataView, fileDataOffset, length),
    "Color Components": numberOfColorComponents,
    "Subsampling": numberOfColorComponents && getSubsampling(dataView, fileDataOffset, numberOfColorComponents.value, length)
  };
}
function getLength$1(dataView, fileDataOffset) {
  return Types.getShortAt(dataView, fileDataOffset);
}
function getDataPrecision(dataView, fileDataOffset, length) {
  const OFFSET = 2;
  const SIZE = 1;
  if (OFFSET + SIZE > length) {
    return void 0;
  }
  const value = Types.getByteAt(dataView, fileDataOffset + OFFSET);
  return {
    value,
    description: "" + value
  };
}
function getImageHeight$2(dataView, fileDataOffset, length) {
  const OFFSET = 3;
  const SIZE = 2;
  if (OFFSET + SIZE > length) {
    return void 0;
  }
  const value = Types.getShortAt(dataView, fileDataOffset + OFFSET);
  return {
    value,
    description: `${value}px`
  };
}
function getImageWidth$2(dataView, fileDataOffset, length) {
  const OFFSET = 5;
  const SIZE = 2;
  if (OFFSET + SIZE > length) {
    return void 0;
  }
  const value = Types.getShortAt(dataView, fileDataOffset + OFFSET);
  return {
    value,
    description: `${value}px`
  };
}
function getNumberOfColorComponents(dataView, fileDataOffset, length) {
  const OFFSET = 7;
  const SIZE = 1;
  if (OFFSET + SIZE > length) {
    return void 0;
  }
  const value = Types.getByteAt(dataView, fileDataOffset + OFFSET);
  return {
    value,
    description: "" + value
  };
}
function getSubsampling(dataView, fileDataOffset, numberOfColorComponents, length) {
  const OFFSET = 8;
  const SIZE = 3 * numberOfColorComponents;
  if (OFFSET + SIZE > length) {
    return void 0;
  }
  const components = [];
  for (let i = 0; i < numberOfColorComponents; i++) {
    const componentOffset = fileDataOffset + OFFSET + i * 3;
    components.push([
      Types.getByteAt(dataView, componentOffset),
      Types.getByteAt(dataView, componentOffset + 1),
      Types.getByteAt(dataView, componentOffset + 2)
    ]);
  }
  return {
    value: components,
    description: components.length > 1 ? getComponentIds(components) + getSamplingType(components) : ""
  };
}
function getComponentIds(components) {
  const ids = {
    1: "Y",
    2: "Cb",
    3: "Cr",
    4: "I",
    5: "Q"
  };
  return components.map((compontent) => ids[compontent[0]]).join("");
}
function getSamplingType(components) {
  const types = {
    17: "4:4:4 (1 1)",
    18: "4:4:0 (1 2)",
    20: "4:4:1 (1 4)",
    33: "4:2:2 (2 1)",
    34: "4:2:0 (2 2)",
    36: "4:2:1 (2 4)",
    65: "4:1:1 (4 1)",
    66: "4:1:0 (4 2)"
  };
  if (components.length === 0 || components[0][1] === void 0 || types[components[0][1]] === void 0) {
    return "";
  }
  return types[components[0][1]];
}
const JfifTags = {
  read: read$a
};
function read$a(dataView, jfifDataOffset) {
  const length = getLength(dataView, jfifDataOffset);
  const thumbnailWidth = getThumbnailWidth(dataView, jfifDataOffset, length);
  const thumbnailHeight = getThumbnailHeight(dataView, jfifDataOffset, length);
  const tags = {
    "JFIF Version": getVersion(dataView, jfifDataOffset, length),
    "Resolution Unit": getResolutionUnit(dataView, jfifDataOffset, length),
    "XResolution": getXResolution(dataView, jfifDataOffset, length),
    "YResolution": getYResolution(dataView, jfifDataOffset, length),
    "JFIF Thumbnail Width": thumbnailWidth,
    "JFIF Thumbnail Height": thumbnailHeight
  };
  if (thumbnailWidth !== void 0 && thumbnailHeight !== void 0) {
    const thumbnail = getThumbnail(dataView, jfifDataOffset, 3 * thumbnailWidth.value * thumbnailHeight.value, length);
    if (thumbnail) {
      tags["JFIF Thumbnail"] = thumbnail;
    }
  }
  for (const tagName in tags) {
    if (tags[tagName] === void 0) {
      delete tags[tagName];
    }
  }
  return tags;
}
function getLength(dataView, jfifDataOffset) {
  return Types.getShortAt(dataView, jfifDataOffset);
}
function getVersion(dataView, jfifDataOffset, length) {
  const OFFSET = 7;
  const SIZE = 2;
  if (OFFSET + SIZE > length) {
    return void 0;
  }
  const majorVersion = Types.getByteAt(dataView, jfifDataOffset + OFFSET);
  const minorVersion = Types.getByteAt(dataView, jfifDataOffset + OFFSET + 1);
  return {
    value: majorVersion * 256 + minorVersion,
    description: majorVersion + "." + minorVersion
  };
}
function getResolutionUnit(dataView, jfifDataOffset, length) {
  const OFFSET = 9;
  const SIZE = 1;
  if (OFFSET + SIZE > length) {
    return void 0;
  }
  const value = Types.getByteAt(dataView, jfifDataOffset + OFFSET);
  return {
    value,
    description: getResolutionUnitDescription(value)
  };
}
function getResolutionUnitDescription(value) {
  if (value === 0) {
    return "None";
  }
  if (value === 1) {
    return "inches";
  }
  if (value === 2) {
    return "cm";
  }
  return "Unknown";
}
function getXResolution(dataView, jfifDataOffset, length) {
  const OFFSET = 10;
  const SIZE = 2;
  if (OFFSET + SIZE > length) {
    return void 0;
  }
  const value = Types.getShortAt(dataView, jfifDataOffset + OFFSET);
  return {
    value,
    description: "" + value
  };
}
function getYResolution(dataView, jfifDataOffset, length) {
  const OFFSET = 12;
  const SIZE = 2;
  if (OFFSET + SIZE > length) {
    return void 0;
  }
  const value = Types.getShortAt(dataView, jfifDataOffset + OFFSET);
  return {
    value,
    description: "" + value
  };
}
function getThumbnailWidth(dataView, jfifDataOffset, length) {
  const OFFSET = 14;
  const SIZE = 1;
  if (OFFSET + SIZE > length) {
    return void 0;
  }
  const value = Types.getByteAt(dataView, jfifDataOffset + OFFSET);
  return {
    value,
    description: `${value}px`
  };
}
function getThumbnailHeight(dataView, jfifDataOffset, length) {
  const OFFSET = 15;
  const SIZE = 1;
  if (OFFSET + SIZE > length) {
    return void 0;
  }
  const value = Types.getByteAt(dataView, jfifDataOffset + OFFSET);
  return {
    value,
    description: `${value}px`
  };
}
function getThumbnail(dataView, jfifDataOffset, thumbnailLength, length) {
  const OFFSET = 16;
  if (thumbnailLength === 0 || OFFSET + thumbnailLength > length) {
    return void 0;
  }
  const value = dataView.buffer.slice(jfifDataOffset + OFFSET, jfifDataOffset + OFFSET + thumbnailLength);
  return {
    value,
    description: "<24-bit RGB pixel data>"
  };
}
const IptcTagNames = {
  "iptc": {
    256: {
      "name": "Model Version",
      "description": (value) => {
        return ((value[0] << 8) + value[1]).toString();
      }
    },
    261: {
      "name": "Destination",
      "repeatable": true
    },
    276: {
      "name": "File Format",
      "description": (value) => {
        return ((value[0] << 8) + value[1]).toString();
      }
    },
    278: {
      "name": "File Format Version",
      "description": (value) => {
        return ((value[0] << 8) + value[1]).toString();
      }
    },
    286: "Service Identifier",
    296: "Envelope Number",
    306: "Product ID",
    316: "Envelope Priority",
    326: {
      "name": "Date Sent",
      "description": getCreationDate
    },
    336: {
      "name": "Time Sent",
      "description": getCreationTime
    },
    346: {
      "name": "Coded Character Set",
      "description": getEncodingName,
      "encoding_name": getEncodingName
    },
    356: "UNO",
    376: {
      "name": "ARM Identifier",
      "description": (value) => {
        return ((value[0] << 8) + value[1]).toString();
      }
    },
    378: {
      "name": "ARM Version",
      "description": (value) => {
        return ((value[0] << 8) + value[1]).toString();
      }
    },
    512: {
      "name": "Record Version",
      "description": (value) => {
        return ((value[0] << 8) + value[1]).toString();
      }
    },
    515: "Object Type Reference",
    516: "Object Attribute Reference",
    517: "Object Name",
    519: "Edit Status",
    520: {
      "name": "Editorial Update",
      "description": (value) => {
        if (getStringValue(value) === "01") {
          return "Additional Language";
        }
        return "Unknown";
      }
    },
    522: "Urgency",
    524: {
      "name": "Subject Reference",
      "repeatable": true,
      "description": (value) => {
        const parts = getStringValue(value).split(":");
        return parts[2] + (parts[3] ? "/" + parts[3] : "") + (parts[4] ? "/" + parts[4] : "");
      }
    },
    527: "Category",
    532: {
      "name": "Supplemental Category",
      "repeatable": true
    },
    534: "Fixture Identifier",
    537: {
      "name": "Keywords",
      "repeatable": true
    },
    538: {
      "name": "Content Location Code",
      "repeatable": true
    },
    539: {
      "name": "Content Location Name",
      "repeatable": true
    },
    542: "Release Date",
    547: "Release Time",
    549: "Expiration Date",
    550: "Expiration Time",
    552: "Special Instructions",
    554: {
      "name": "Action Advised",
      "description": (value) => {
        const string = getStringValue(value);
        if (string === "01") {
          return "Object Kill";
        } else if (string === "02") {
          return "Object Replace";
        } else if (string === "03") {
          return "Object Append";
        } else if (string === "04") {
          return "Object Reference";
        }
        return "Unknown";
      }
    },
    557: {
      "name": "Reference Service",
      "repeatable": true
    },
    559: {
      "name": "Reference Date",
      "repeatable": true
    },
    562: {
      "name": "Reference Number",
      "repeatable": true
    },
    567: {
      "name": "Date Created",
      "description": getCreationDate
    },
    572: {
      "name": "Time Created",
      "description": getCreationTime
    },
    574: {
      "name": "Digital Creation Date",
      "description": getCreationDate
    },
    575: {
      "name": "Digital Creation Time",
      "description": getCreationTime
    },
    577: "Originating Program",
    582: "Program Version",
    587: {
      "name": "Object Cycle",
      "description": (value) => {
        const string = getStringValue(value);
        if (string === "a") {
          return "morning";
        } else if (string === "p") {
          return "evening";
        } else if (string === "b") {
          return "both";
        }
        return "Unknown";
      }
    },
    592: {
      "name": "By-line",
      "repeatable": true
    },
    597: {
      "name": "By-line Title",
      "repeatable": true
    },
    602: "City",
    604: "Sub-location",
    607: "Province/State",
    612: "Country/Primary Location Code",
    613: "Country/Primary Location Name",
    615: "Original Transmission Reference",
    617: "Headline",
    622: "Credit",
    627: "Source",
    628: "Copyright Notice",
    630: {
      "name": "Contact",
      "repeatable": true
    },
    632: "Caption/Abstract",
    634: {
      "name": "Writer/Editor",
      "repeatable": true
    },
    637: {
      "name": "Rasterized Caption",
      "description": (value) => value
    },
    642: "Image Type",
    643: {
      "name": "Image Orientation",
      "description": (value) => {
        const string = getStringValue(value);
        if (string === "P") {
          return "Portrait";
        } else if (string === "L") {
          return "Landscape";
        } else if (string === "S") {
          return "Square";
        }
        return "Unknown";
      }
    },
    647: "Language Identifier",
    662: {
      "name": "Audio Type",
      "description": (value) => {
        const stringValue = getStringValue(value);
        const character0 = stringValue.charAt(0);
        const character1 = stringValue.charAt(1);
        let description = "";
        if (character0 === "1") {
          description += "Mono";
        } else if (character0 === "2") {
          description += "Stereo";
        }
        if (character1 === "A") {
          description += ", actuality";
        } else if (character1 === "C") {
          description += ", question and answer session";
        } else if (character1 === "M") {
          description += ", music, transmitted by itself";
        } else if (character1 === "Q") {
          description += ", response to a question";
        } else if (character1 === "R") {
          description += ", raw sound";
        } else if (character1 === "S") {
          description += ", scener";
        } else if (character1 === "V") {
          description += ", voicer";
        } else if (character1 === "W") {
          description += ", wrap";
        }
        if (description !== "") {
          return description;
        }
        return stringValue;
      }
    },
    663: {
      "name": "Audio Sampling Rate",
      "description": (value) => parseInt(getStringValue(value), 10) + " Hz"
    },
    664: {
      "name": "Audio Sampling Resolution",
      "description": (value) => {
        const bits = parseInt(getStringValue(value), 10);
        return bits + (bits === 1 ? " bit" : " bits");
      }
    },
    665: {
      "name": "Audio Duration",
      "description": (value) => {
        const duration = getStringValue(value);
        if (duration.length >= 6) {
          return duration.substr(0, 2) + ":" + duration.substr(2, 2) + ":" + duration.substr(4, 2);
        }
        return duration;
      }
    },
    666: "Audio Outcue",
    698: "Short Document ID",
    699: "Unique Document ID",
    700: "Owner ID",
    712: {
      "name": (value) => {
        if (value.length === 2) {
          return "ObjectData Preview File Format";
        }
        return "Record 2 destination";
      },
      "description": (value) => {
        if (value.length === 2) {
          const intValue = (value[0] << 8) + value[1];
          if (intValue === 0) {
            return "No ObjectData";
          } else if (intValue === 1) {
            return "IPTC-NAA Digital Newsphoto Parameter Record";
          } else if (intValue === 2) {
            return "IPTC7901 Recommended Message Format";
          } else if (intValue === 3) {
            return "Tagged Image File Format (Adobe/Aldus Image data)";
          } else if (intValue === 4) {
            return "Illustrator (Adobe Graphics data)";
          } else if (intValue === 5) {
            return "AppleSingle (Apple Computer Inc)";
          } else if (intValue === 6) {
            return "NAA 89-3 (ANPA 1312)";
          } else if (intValue === 7) {
            return "MacBinary II";
          } else if (intValue === 8) {
            return "IPTC Unstructured Character Oriented File Format (UCOFF)";
          } else if (intValue === 9) {
            return "United Press International ANPA 1312 variant";
          } else if (intValue === 10) {
            return "United Press International Down-Load Message";
          } else if (intValue === 11) {
            return "JPEG File Interchange (JFIF)";
          } else if (intValue === 12) {
            return "Photo-CD Image-Pac (Eastman Kodak)";
          } else if (intValue === 13) {
            return "Microsoft Bit Mapped Graphics File [*.BMP]";
          } else if (intValue === 14) {
            return "Digital Audio File [*.WAV] (Microsoft & Creative Labs)";
          } else if (intValue === 15) {
            return "Audio plus Moving Video [*.AVI] (Microsoft)";
          } else if (intValue === 16) {
            return "PC DOS/Windows Executable Files [*.COM][*.EXE]";
          } else if (intValue === 17) {
            return "Compressed Binary File [*.ZIP] (PKWare Inc)";
          } else if (intValue === 18) {
            return "Audio Interchange File Format AIFF (Apple Computer Inc)";
          } else if (intValue === 19) {
            return "RIFF Wave (Microsoft Corporation)";
          } else if (intValue === 20) {
            return "Freehand (Macromedia/Aldus)";
          } else if (intValue === 21) {
            return 'Hypertext Markup Language "HTML" (The Internet Society)';
          } else if (intValue === 22) {
            return "MPEG 2 Audio Layer 2 (Musicom), ISO/IEC";
          } else if (intValue === 23) {
            return "MPEG 2 Audio Layer 3, ISO/IEC";
          } else if (intValue === 24) {
            return "Portable Document File (*.PDF) Adobe";
          } else if (intValue === 25) {
            return "News Industry Text Format (NITF)";
          } else if (intValue === 26) {
            return "Tape Archive (*.TAR)";
          } else if (intValue === 27) {
            return "Tidningarnas Telegrambyrå NITF version (TTNITF DTD)";
          } else if (intValue === 28) {
            return "Ritzaus Bureau NITF version (RBNITF DTD)";
          } else if (intValue === 29) {
            return "Corel Draw [*.CDR]";
          }
          return `Unknown format ${intValue}`;
        }
        return getStringValue(value);
      }
    },
    713: {
      "name": "ObjectData Preview File Format Version",
      "description": (value, tags) => {
        const formatVersions = {
          "00": { "00": "1" },
          "01": { "01": "1", "02": "2", "03": "3", "04": "4" },
          "02": { "04": "4" },
          "03": { "01": "5.0", "02": "6.0" },
          "04": { "01": "1.40" },
          "05": { "01": "2" },
          "06": { "01": "1" },
          "11": { "01": "1.02" },
          "20": { "01": "3.1", "02": "4.0", "03": "5.0", "04": "5.5" },
          "21": { "02": "2.0" }
        };
        const stringValue = getStringValue(value);
        if (tags["ObjectData Preview File Format"]) {
          const objectDataPreviewFileFormat = getStringValue(tags["ObjectData Preview File Format"].value);
          if (formatVersions[objectDataPreviewFileFormat] && formatVersions[objectDataPreviewFileFormat][stringValue]) {
            return formatVersions[objectDataPreviewFileFormat][stringValue];
          }
        }
        return stringValue;
      }
    },
    714: "ObjectData Preview Data",
    1802: {
      "name": "Size Mode",
      "description": (value) => {
        return value[0].toString();
      }
    },
    1812: {
      "name": "Max Subfile Size",
      "description": (value) => {
        let n = 0;
        for (let i = 0; i < value.length; i++) {
          n = (n << 8) + value[i];
        }
        return n.toString();
      }
    },
    1882: {
      "name": "ObjectData Size Announced",
      "description": (value) => {
        let n = 0;
        for (let i = 0; i < value.length; i++) {
          n = (n << 8) + value[i];
        }
        return n.toString();
      }
    },
    1887: {
      "name": "Maximum ObjectData Size",
      "description": (value) => {
        let n = 0;
        for (let i = 0; i < value.length; i++) {
          n = (n << 8) + value[i];
        }
        return n.toString();
      }
    }
  }
};
function getCreationDate(value) {
  const date = getStringValue(value);
  if (date.length >= 8) {
    return date.substr(0, 4) + "-" + date.substr(4, 2) + "-" + date.substr(6, 2);
  }
  return date;
}
function getCreationTime(value) {
  const time = getStringValue(value);
  let parsedTime = time;
  if (time.length >= 6) {
    parsedTime = time.substr(0, 2) + ":" + time.substr(2, 2) + ":" + time.substr(4, 2);
    if (time.length === 11) {
      parsedTime += time.substr(6, 1) + time.substr(7, 2) + ":" + time.substr(9, 2);
    }
  }
  return parsedTime;
}
function getEncodingName(value) {
  const string = getStringValue(value);
  if (string === "\x1B%G") {
    return "UTF-8";
  } else if (string === "\x1B%5") {
    return "Windows-1252";
  } else if (string === "\x1B%/G") {
    return "UTF-8 Level 1";
  } else if (string === "\x1B%/H") {
    return "UTF-8 Level 2";
  } else if (string === "\x1B%/I") {
    return "UTF-8 Level 3";
  } else if (string === "\x1B/A") {
    return "ISO-8859-1";
  } else if (string === "\x1B/B") {
    return "ISO-8859-2";
  } else if (string === "\x1B/C") {
    return "ISO-8859-3";
  } else if (string === "\x1B/D") {
    return "ISO-8859-4";
  } else if (string === "\x1B/@") {
    return "ISO-8859-5";
  } else if (string === "\x1B/G") {
    return "ISO-8859-6";
  } else if (string === "\x1B/F") {
    return "ISO-8859-7";
  } else if (string === "\x1B/H") {
    return "ISO-8859-8";
  }
  return "Unknown";
}
const TextDecoder$1 = {
  get: get$2
};
function get$2() {
  if (typeof TextDecoder !== "undefined") {
    return TextDecoder;
  }
  return void 0;
}
const TAG_HEADER_SIZE$1 = 5;
const TagDecoder = {
  decode,
  TAG_HEADER_SIZE: TAG_HEADER_SIZE$1
};
function decode(encoding, tagValue) {
  const Decoder = TextDecoder$1.get();
  if (typeof Decoder !== "undefined" && encoding !== void 0) {
    try {
      return new Decoder(encoding).decode(tagValue instanceof DataView ? tagValue.buffer : Uint8Array.from(tagValue));
    } catch (error) {
    }
  }
  const stringValue = tagValue.map((charCode) => String.fromCharCode(charCode)).join("");
  return decodeAsciiValue(stringValue);
}
function decodeAsciiValue(asciiValue) {
  try {
    return decodeURIComponent(escape(asciiValue));
  } catch (error) {
    return asciiValue;
  }
}
const BYTES_8BIM = 943868237;
const BYTES_8BIM_SIZE = 4;
const RESOURCE_ID_SIZE = 2;
const RESOURCE_NAME_SIZE_SIZE = 1;
const RESOURCE_NAME_MIN_SIZE = 2;
const RESOURCE_SIZE_SIZE = 4;
const RESOURCE_BLOCK_MIN_HEADER_SIZE = BYTES_8BIM_SIZE + RESOURCE_ID_SIZE + RESOURCE_NAME_MIN_SIZE + RESOURCE_SIZE_SIZE;
const NAA_RESOURCE_BLOCK_TYPE = 1028;
const TAG_HEADER_SIZE = 5;
const IptcTags = {
  read: read$9
};
function read$9(dataView, dataOffset, includeUnknown) {
  try {
    if (Array.isArray(dataView)) {
      return parseTags$1(new DataView(Uint8Array.from(dataView).buffer), { size: dataView.length }, 0, includeUnknown);
    }
    const { naaBlock, dataOffset: newDataOffset } = getNaaResourceBlock(dataView, dataOffset);
    return parseTags$1(dataView, naaBlock, newDataOffset, includeUnknown);
  } catch (error) {
    return {};
  }
}
function getNaaResourceBlock(dataView, dataOffset) {
  while (dataOffset + RESOURCE_BLOCK_MIN_HEADER_SIZE <= dataView.byteLength) {
    const resourceBlock = getResourceBlock(dataView, dataOffset);
    if (isNaaResourceBlock(resourceBlock)) {
      return { naaBlock: resourceBlock, dataOffset: dataOffset + resourceBlock.headerSize };
    }
    dataOffset += resourceBlock.headerSize + resourceBlock.size + getBlockPadding(resourceBlock);
  }
  throw new Error("No IPTC NAA resource block.");
}
function getResourceBlock(dataView, dataOffset) {
  if (dataView.getUint32(dataOffset, false) !== BYTES_8BIM) {
    throw new Error("Not an IPTC resource block.");
  }
  const resourceNameSize = dataView.getUint8(dataOffset + BYTES_8BIM_SIZE + RESOURCE_ID_SIZE);
  const resourceNameTotalSize = (resourceNameSize % 2 === 0 ? resourceNameSize + 1 : resourceNameSize) + RESOURCE_NAME_SIZE_SIZE;
  return {
    headerSize: BYTES_8BIM_SIZE + RESOURCE_ID_SIZE + resourceNameTotalSize + RESOURCE_SIZE_SIZE,
    type: dataView.getUint16(dataOffset + BYTES_8BIM_SIZE),
    size: dataView.getUint32(dataOffset + BYTES_8BIM_SIZE + RESOURCE_ID_SIZE + resourceNameTotalSize)
  };
}
function isNaaResourceBlock(resourceBlock) {
  return resourceBlock.type === NAA_RESOURCE_BLOCK_TYPE;
}
function getBlockPadding(resourceBlock) {
  if (resourceBlock.size % 2 !== 0) {
    return 1;
  }
  return 0;
}
function parseTags$1(dataView, naaBlock, dataOffset, includeUnknown) {
  const tags = {};
  let encoding = void 0;
  const endOfBlockOffset = dataOffset + naaBlock["size"];
  while (dataOffset < endOfBlockOffset && dataOffset < dataView.byteLength) {
    const { tag, tagSize } = readTag(dataView, dataOffset, tags, encoding, includeUnknown);
    if (tag === null) {
      break;
    }
    if (tag) {
      if ("encoding" in tag) {
        encoding = tag.encoding;
      }
      if (tags[tag.name] === void 0 || tag["repeatable"] === void 0) {
        tags[tag.name] = {
          id: tag.id,
          value: tag.value,
          description: tag.description
        };
      } else {
        if (!(tags[tag.name] instanceof Array)) {
          tags[tag.name] = [{
            id: tags[tag.name].id,
            value: tags[tag.name].value,
            description: tags[tag.name].description
          }];
        }
        tags[tag.name].push({
          id: tag.id,
          value: tag.value,
          description: tag.description
        });
      }
    }
    dataOffset += TAG_HEADER_SIZE + tagSize;
  }
  return tags;
}
function readTag(dataView, dataOffset, tags, encoding, includeUnknown) {
  const TAG_CODE_OFFSET = 1;
  const TAG_SIZE_OFFSET = 3;
  if (leadByteIsMissing(dataView, dataOffset)) {
    return { tag: null, tagSize: 0 };
  }
  const tagCode = dataView.getUint16(dataOffset + TAG_CODE_OFFSET);
  const tagSize = dataView.getUint16(dataOffset + TAG_SIZE_OFFSET);
  if (!includeUnknown && !IptcTagNames["iptc"][tagCode]) {
    return { tag: void 0, tagSize };
  }
  const tagValue = getTagValue(dataView, dataOffset + TAG_HEADER_SIZE, tagSize);
  const tag = {
    id: tagCode,
    name: getTagName$1(IptcTagNames["iptc"][tagCode], tagCode, tagValue),
    value: tagValue,
    description: getTagDescription(IptcTagNames["iptc"][tagCode], tagValue, tags, encoding)
  };
  if (tagIsRepeatable(tagCode)) {
    tag["repeatable"] = true;
  }
  if (tagContainsEncoding(tagCode)) {
    tag["encoding"] = IptcTagNames["iptc"][tagCode]["encoding_name"](tagValue);
  }
  return { tag, tagSize };
}
function leadByteIsMissing(dataView, dataOffset) {
  const TAG_LEAD_BYTE = 28;
  return dataView.getUint8(dataOffset) !== TAG_LEAD_BYTE;
}
function getTagValue(dataView, offset, size) {
  const value = [];
  for (let valueIndex = 0; valueIndex < size; valueIndex++) {
    value.push(dataView.getUint8(offset + valueIndex));
  }
  return value;
}
function getTagName$1(tag, tagCode, tagValue) {
  if (!tag) {
    return `undefined-${tagCode}`;
  }
  if (tagIsName(tag)) {
    return tag;
  }
  if (hasDynamicName(tag)) {
    return tag["name"](tagValue);
  }
  return tag["name"];
}
function tagIsName(tag) {
  return typeof tag === "string";
}
function hasDynamicName(tag) {
  return typeof tag["name"] === "function";
}
function getTagDescription(tag, tagValue, tags, encoding) {
  if (hasDescriptionProperty(tag)) {
    try {
      return tag["description"](tagValue, tags);
    } catch (error) {
    }
  }
  if (tagValueIsText(tag, tagValue)) {
    return TagDecoder.decode(encoding, tagValue);
  }
  return tagValue;
}
function tagValueIsText(tag, tagValue) {
  return tag && tagValue instanceof Array;
}
function hasDescriptionProperty(tag) {
  return tag && tag["description"] !== void 0;
}
function tagIsRepeatable(tagCode) {
  return IptcTagNames["iptc"][tagCode] && IptcTagNames["iptc"][tagCode]["repeatable"];
}
function tagContainsEncoding(tagCode) {
  return IptcTagNames["iptc"][tagCode] && IptcTagNames["iptc"][tagCode]["encoding_name"] !== void 0;
}
const XmpTagNames = {
  "tiff:Orientation"(value) {
    if (value === "1") {
      return "Horizontal (normal)";
    }
    if (value === "2") {
      return "Mirror horizontal";
    }
    if (value === "3") {
      return "Rotate 180";
    }
    if (value === "4") {
      return "Mirror vertical";
    }
    if (value === "5") {
      return "Mirror horizontal and rotate 270 CW";
    }
    if (value === "6") {
      return "Rotate 90 CW";
    }
    if (value === "7") {
      return "Mirror horizontal and rotate 90 CW";
    }
    if (value === "8") {
      return "Rotate 270 CW";
    }
    return value;
  },
  "tiff:ResolutionUnit": (value) => TagNamesCommon.ResolutionUnit(parseInt(value, 10)),
  "tiff:XResolution": (value) => fraction(TagNamesCommon.XResolution, value),
  "tiff:YResolution": (value) => fraction(TagNamesCommon.YResolution, value),
  "exif:ApertureValue": (value) => fraction(TagNamesCommon.ApertureValue, value),
  "exif:GPSLatitude": calculateGPSValue,
  "exif:GPSLongitude": calculateGPSValue,
  "exif:FNumber": (value) => fraction(TagNamesCommon.FNumber, value),
  "exif:FocalLength": (value) => fraction(TagNamesCommon.FocalLength, value),
  "exif:FocalPlaneResolutionUnit": (value) => TagNamesCommon.FocalPlaneResolutionUnit(parseInt(value, 10)),
  "exif:ColorSpace": (value) => TagNamesCommon.ColorSpace(parseNumber(value)),
  "exif:ComponentsConfiguration"(value, description) {
    if (/^\d, \d, \d, \d$/.test(description)) {
      const numbers = description.split(", ").map((number) => number.charCodeAt(0));
      return TagNamesCommon.ComponentsConfiguration(numbers);
    }
    return description;
  },
  "exif:Contrast": (value) => TagNamesCommon.Contrast(parseInt(value, 10)),
  "exif:CustomRendered": (value) => TagNamesCommon.CustomRendered(parseInt(value, 10)),
  "exif:ExposureMode": (value) => TagNamesCommon.ExposureMode(parseInt(value, 10)),
  "exif:ExposureProgram": (value) => TagNamesCommon.ExposureProgram(parseInt(value, 10)),
  "exif:ExposureTime"(value) {
    if (isFraction(value)) {
      return TagNamesCommon.ExposureTime(value.split("/").map((number) => parseInt(number, 10)));
    }
    return value;
  },
  "exif:MeteringMode": (value) => TagNamesCommon.MeteringMode(parseInt(value, 10)),
  "exif:Saturation": (value) => TagNamesCommon.Saturation(parseInt(value, 10)),
  "exif:SceneCaptureType": (value) => TagNamesCommon.SceneCaptureType(parseInt(value, 10)),
  "exif:Sharpness": (value) => TagNamesCommon.Sharpness(parseInt(value, 10)),
  "exif:ShutterSpeedValue": (value) => fraction(TagNamesCommon.ShutterSpeedValue, value),
  "exif:WhiteBalance": (value) => TagNamesCommon.WhiteBalance(parseInt(value, 10))
};
function fraction(func, value) {
  if (isFraction(value)) {
    return func(value.split("/"));
  }
  return value;
}
function parseNumber(value) {
  if (value.substring(0, 2) === "0x") {
    return parseInt(value.substring(2), 16);
  }
  return parseInt(value, 10);
}
function isFraction(value) {
  return /^-?\d+\/-?\d+$/.test(value);
}
function calculateGPSValue(value) {
  const [degreesString, minutesString] = value.split(",");
  if (degreesString !== void 0 && minutesString !== void 0) {
    const degrees = parseFloat(degreesString);
    const minutes = parseFloat(minutesString);
    const ref = minutesString.charAt(minutesString.length - 1);
    if (!Number.isNaN(degrees) && !Number.isNaN(minutes)) {
      return "" + (degrees + minutes / 60) + ref;
    }
  }
  return value;
}
const DOMParser$1 = {
  get: get$1
};
function get$1(domParser) {
  if (domParser) {
    return domParser;
  }
  if (typeof DOMParser !== "undefined") {
    return new DOMParser();
  }
  try {
    const { DOMParser: DOMParser2, onErrorStopParsing } = __non_webpack_require__("@xmldom/xmldom");
    return new DOMParser2({ onError: onErrorStopParsing });
  } catch (error) {
    return void 0;
  }
}
function isMissingNamespaceError(error) {
  const missingNamespaceStrings = [
    // @xmldom/xmldom
    "prefix is non-null and namespace is null",
    // Firefox
    "prefix not bound to a namespace",
    // en
    "prefix inte bundet till en namnrymd",
    // sv
    // Chrome
    /Namespace prefix .+ is not defined/
  ];
  for (let i = 0; i < missingNamespaceStrings.length; i++) {
    const regexp = new RegExp(missingNamespaceStrings[i]);
    if (regexp.test(error.message)) {
      return true;
    }
  }
  return false;
}
function addMissingNamespaces(xmlString) {
  const rootTagMatch = xmlString.match(/<([A-Za-z_][A-Za-z0-9._-]*)([^>]*)>/);
  if (!rootTagMatch) {
    return xmlString;
  }
  const rootTagName = rootTagMatch[1];
  const declaredPrefixes = getAllDeclaredNamespacePrefixes(xmlString);
  const usedPrefixes = getUsedNamespacePrefixes(xmlString);
  const missingPrefixes = usedPrefixes.filter((prefix) => declaredPrefixes.indexOf(prefix) === -1);
  if (missingPrefixes.length === 0) {
    return xmlString;
  }
  const namespaceDeclarations = createNamespaceDeclarations(missingPrefixes);
  return insertDeclarationsIntoRoot(xmlString, rootTagName, namespaceDeclarations);
}
function getAllDeclaredNamespacePrefixes(xmlContent) {
  const prefixes = [];
  const namespaceDeclarationRegex = /xmlns:([\w-]+)=["'][^"']+["']/g;
  let match;
  while ((match = namespaceDeclarationRegex.exec(xmlContent)) !== null) {
    if (prefixes.indexOf(match[1]) === -1) {
      prefixes.push(match[1]);
    }
  }
  return prefixes;
}
function getUsedNamespacePrefixes(xmlContent) {
  const prefixes = [];
  const prefixUsageRegex = /\b([A-Za-z_][A-Za-z0-9._-]*):[A-Za-z_][A-Za-z0-9._-]*\b/g;
  let match;
  while ((match = prefixUsageRegex.exec(xmlContent)) !== null) {
    const prefix = match[1];
    if (prefix === "xmlns" || prefix === "xml") {
      continue;
    }
    if (prefixes.indexOf(prefix) === -1) {
      prefixes.push(prefix);
    }
  }
  return prefixes;
}
const KNOWN_NAMESPACE_URIS = {
  xmp: "http://ns.adobe.com/xap/1.0/",
  tiff: "http://ns.adobe.com/tiff/1.0/",
  exif: "http://ns.adobe.com/exif/1.0/",
  dc: "http://purl.org/dc/elements/1.1/",
  xmpMM: "http://ns.adobe.com/xap/1.0/mm/",
  stEvt: "http://ns.adobe.com/xap/1.0/sType/ResourceEvent#",
  stRef: "http://ns.adobe.com/xap/1.0/sType/ResourceRef#",
  photoshop: "http://ns.adobe.com/photoshop/1.0/"
};
function createNamespaceDeclarations(prefixes) {
  const declarations = [];
  for (let i = 0; i < prefixes.length; i++) {
    const prefix = prefixes[i];
    const uri = KNOWN_NAMESPACE_URIS[prefix] || "http://fallback.namespace/" + prefix;
    declarations.push(" xmlns:" + prefix + '="' + uri + '"');
  }
  return declarations.join("");
}
function insertDeclarationsIntoRoot(xmlString, rootTagName, declarations) {
  const rootTagPattern = new RegExp("<" + rootTagName + "([^>]*)>");
  return xmlString.replace(rootTagPattern, "<" + rootTagName + "$1" + declarations + ">");
}
const XmpTags = {
  read: read$8
};
class ParseError extends Error {
  constructor(message) {
    super(message);
    this.name = "ParseError";
  }
}
function read$8(dataView, chunks, domParser) {
  const tags = {};
  if (typeof dataView === "string") {
    readTags(tags, dataView, domParser);
    return tags;
  }
  const [standardXmp, extendedXmp] = extractCompleteChunks(dataView, chunks);
  const hasStandardTags = readTags(tags, standardXmp, domParser);
  if (extendedXmp) {
    const hasExtendedTags = readTags(tags, extendedXmp, domParser);
    if (!hasStandardTags && !hasExtendedTags) {
      delete tags._raw;
      readTags(tags, combineChunks(dataView, chunks), domParser);
    }
  }
  return tags;
}
function extractCompleteChunks(dataView, chunks) {
  if (chunks.length === 0) {
    return [];
  }
  const completeChunks = [combineChunks(dataView, chunks.slice(0, 1))];
  if (chunks.length > 1) {
    completeChunks.push(combineChunks(dataView, chunks.slice(1)));
  }
  return completeChunks;
}
function combineChunks(dataView, chunks) {
  const totalLength = chunks.reduce((size, chunk) => size + chunk.length, 0);
  const combinedChunks = new Uint8Array(totalLength);
  let offset = 0;
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const slice = dataView.buffer.slice(chunk.dataOffset, chunk.dataOffset + chunk.length);
    combinedChunks.set(new Uint8Array(slice), offset);
    offset += chunk.length;
  }
  return new DataView(combinedChunks.buffer);
}
function readTags(tags, chunkDataView, domParser) {
  try {
    const { doc, raw } = getDocument(chunkDataView, domParser);
    tags._raw = (tags._raw || "") + raw;
    const rdf = getRDF(doc);
    objectAssign(tags, parseXMPObject(convertToObject(rdf, true)));
    return true;
  } catch (error) {
    return false;
  }
}
function getDocument(chunkDataView, _domParser) {
  const domParser = DOMParser$1.get(_domParser);
  if (!domParser) {
    console.warn("Warning: DOMParser is not available. It is needed to be able to parse XMP tags.");
    throw new Error();
  }
  const xmlString = typeof chunkDataView === "string" ? chunkDataView : getStringFromDataView(chunkDataView, 0, chunkDataView.byteLength);
  const doc = parseFromString(domParser, trimXmlSource(xmlString));
  return {
    doc,
    raw: xmlString
  };
}
function trimXmlSource(xmlSource) {
  return xmlSource.replace(/^.+(<\?xpacket begin)/, "$1").replace(/(<\?xpacket end=".*"\?>).+$/, "$1");
}
function parseFromString(domParser, xmlString, isRetry = false) {
  try {
    const doc = domParser.parseFromString(xmlString, "application/xml");
    const errors = doc.getElementsByTagName("parsererror");
    if (errors.length > 0) {
      throw new ParseError(errors[0].textContent);
    }
    return doc;
  } catch (error) {
    if (error.name === "ParseError" && isMissingNamespaceError(error) && !isRetry) {
      return parseFromString(domParser, addMissingNamespaces(xmlString), true);
    }
    throw error;
  }
}
function getRDF(node) {
  for (let i = 0; i < node.childNodes.length; i++) {
    if (node.childNodes[i].tagName === "x:xmpmeta") {
      return getRDF(node.childNodes[i]);
    }
    if (node.childNodes[i].tagName === "rdf:RDF") {
      return node.childNodes[i];
    }
  }
  throw new Error();
}
function convertToObject(node, isTopNode = false) {
  const childNodes = getChildNodes(node);
  if (hasTextOnlyContent(childNodes)) {
    if (isTopNode) {
      return {};
    }
    return getTextValue(childNodes[0]);
  }
  return getElementsFromNodes(childNodes);
}
function getChildNodes(node) {
  const elements = [];
  for (let i = 0; i < node.childNodes.length; i++) {
    elements.push(node.childNodes[i]);
  }
  return elements;
}
function hasTextOnlyContent(nodes) {
  return nodes.length === 1 && nodes[0].nodeName === "#text";
}
function getTextValue(node) {
  return node.nodeValue;
}
function getElementsFromNodes(nodes) {
  const elements = {};
  nodes.forEach((node) => {
    if (isElement(node)) {
      const nodeElement = getElementFromNode(node);
      if (elements[node.nodeName] !== void 0) {
        if (!Array.isArray(elements[node.nodeName])) {
          elements[node.nodeName] = [elements[node.nodeName]];
        }
        elements[node.nodeName].push(nodeElement);
      } else {
        elements[node.nodeName] = nodeElement;
      }
    }
  });
  return elements;
}
function isElement(node) {
  return node.nodeName && node.nodeName !== "#text";
}
function getElementFromNode(node) {
  return {
    attributes: getAttributes(node),
    value: convertToObject(node)
  };
}
function getAttributes(element) {
  const attributes = {};
  for (let i = 0; i < element.attributes.length; i++) {
    attributes[element.attributes[i].nodeName] = decodeURIComponent(escape(element.attributes[i].value));
  }
  return attributes;
}
function parseXMPObject(xmpObject) {
  const tags = {};
  if (typeof xmpObject === "string") {
    return xmpObject;
  }
  for (const nodeName in xmpObject) {
    let nodes = xmpObject[nodeName];
    if (!Array.isArray(nodes)) {
      nodes = [nodes];
    }
    nodes.forEach((node) => {
      objectAssign(tags, parseNodeAttributesAsTags(node.attributes));
      if (typeof node.value === "object") {
        objectAssign(tags, parseNodeChildrenAsTags(node.value));
      }
    });
  }
  return tags;
}
function parseNodeAttributesAsTags(attributes) {
  const tags = {};
  for (const name in attributes) {
    try {
      if (isTagAttribute(name)) {
        tags[getLocalName(name)] = {
          value: attributes[name],
          attributes: {},
          description: getDescription$1(attributes[name], name)
        };
      }
    } catch (error) {
    }
  }
  return tags;
}
function isTagAttribute(name) {
  return name !== "rdf:parseType" && !isNamespaceDefinition(name);
}
function isNamespaceDefinition(name) {
  return name.split(":")[0] === "xmlns";
}
function getLocalName(name) {
  if (/^MicrosoftPhoto(_\d+_)?:Rating$/i.test(name)) {
    return "RatingPercent";
  }
  return name.split(":")[1];
}
function getDescription$1(value, name = void 0) {
  if (Array.isArray(value)) {
    const arrayDescription = getDescriptionOfArray(value);
    if (name && typeof XmpTagNames[name] === "function") {
      return XmpTagNames[name](value, arrayDescription);
    }
    return arrayDescription;
  }
  if (typeof value === "object") {
    return getDescriptionOfObject(value);
  }
  try {
    if (name && typeof XmpTagNames[name] === "function") {
      return XmpTagNames[name](value);
    }
    return decodeURIComponent(escape(value));
  } catch (error) {
    return value;
  }
}
function getDescriptionOfArray(value) {
  return value.map((item) => {
    if (item.value !== void 0) {
      return getDescription$1(item.value);
    }
    return getDescription$1(item);
  }).join(", ");
}
function getDescriptionOfObject(value) {
  const descriptions = [];
  for (const key in value) {
    descriptions.push(`${getClearTextKey(key)}: ${getDescription$1(value[key].value)}`);
  }
  return descriptions.join("; ");
}
function getClearTextKey(key) {
  if (key === "CiAdrCity") {
    return "CreatorCity";
  }
  if (key === "CiAdrCtry") {
    return "CreatorCountry";
  }
  if (key === "CiAdrExtadr") {
    return "CreatorAddress";
  }
  if (key === "CiAdrPcode") {
    return "CreatorPostalCode";
  }
  if (key === "CiAdrRegion") {
    return "CreatorRegion";
  }
  if (key === "CiEmailWork") {
    return "CreatorWorkEmail";
  }
  if (key === "CiTelWork") {
    return "CreatorWorkPhone";
  }
  if (key === "CiUrlWork") {
    return "CreatorWorkUrl";
  }
  return key;
}
function parseNodeChildrenAsTags(children) {
  const tags = {};
  for (const name in children) {
    try {
      if (!isNamespaceDefinition(name)) {
        tags[getLocalName(name)] = parseNodeAsTag(children[name], name);
      }
    } catch (error) {
    }
  }
  return tags;
}
function parseNodeAsTag(node, name) {
  if (isDuplicateTag(node)) {
    return parseNodeAsDuplicateTag(node, name);
  }
  if (isEmptyResourceTag(node)) {
    return { value: "", attributes: {}, description: "" };
  }
  if (hasNestedSimpleRdfDescription(node)) {
    return parseNodeAsSimpleRdfDescription(node, name);
  }
  if (hasNestedStructureRdfDescription(node)) {
    return parseNodeAsStructureRdfDescription(node, name);
  }
  if (isCompactStructure(node)) {
    return parseNodeAsCompactStructure(node, name);
  }
  if (isArray(node)) {
    return parseNodeAsArray(node, name);
  }
  return parseNodeAsSimpleValue(node, name);
}
function isEmptyResourceTag(node) {
  return node.attributes["rdf:parseType"] === "Resource" && typeof node.value === "string" && node.value.trim() === "";
}
function isDuplicateTag(node) {
  return Array.isArray(node);
}
function parseNodeAsDuplicateTag(node, name) {
  return parseNodeAsSimpleValue(node[node.length - 1], name);
}
function hasNestedSimpleRdfDescription(node) {
  return node.attributes["rdf:parseType"] === "Resource" && node.value["rdf:value"] !== void 0 || node.value["rdf:Description"] !== void 0 && node.value["rdf:Description"].value["rdf:value"] !== void 0;
}
function parseNodeAsSimpleRdfDescription(node, name) {
  const attributes = parseNodeAttributes(node);
  if (node.value["rdf:Description"] !== void 0) {
    node = node.value["rdf:Description"];
  }
  objectAssign(attributes, parseNodeAttributes(node), parseNodeChildrenAsAttributes(node));
  const value = parseRdfValue(node);
  return {
    value,
    attributes,
    description: getDescription$1(value, name)
  };
}
function parseNodeAttributes(node) {
  const attributes = {};
  for (const name in node.attributes) {
    if (name !== "rdf:parseType" && name !== "rdf:resource" && !isNamespaceDefinition(name)) {
      attributes[getLocalName(name)] = node.attributes[name];
    }
  }
  return attributes;
}
function parseNodeChildrenAsAttributes(node) {
  const attributes = {};
  for (const name in node.value) {
    if (name !== "rdf:value" && !isNamespaceDefinition(name)) {
      attributes[getLocalName(name)] = node.value[name].value;
    }
  }
  return attributes;
}
function parseRdfValue(node) {
  return getURIValue(node.value["rdf:value"]) || node.value["rdf:value"].value;
}
function hasNestedStructureRdfDescription(node) {
  return node.attributes["rdf:parseType"] === "Resource" || node.value["rdf:Description"] !== void 0 && node.value["rdf:Description"].value["rdf:value"] === void 0;
}
function parseNodeAsStructureRdfDescription(node, name) {
  const tag = {
    value: {},
    attributes: {}
  };
  if (node.value["rdf:Description"] !== void 0) {
    objectAssign(tag.value, parseNodeAttributesAsTags(node.value["rdf:Description"].attributes));
    objectAssign(tag.attributes, parseNodeAttributes(node));
    node = node.value["rdf:Description"];
  }
  objectAssign(tag.value, parseNodeChildrenAsTags(node.value));
  tag.description = getDescription$1(tag.value, name);
  return tag;
}
function isCompactStructure(node) {
  return Object.keys(node.value).length === 0 && node.attributes["xml:lang"] === void 0 && node.attributes["rdf:resource"] === void 0;
}
function parseNodeAsCompactStructure(node, name) {
  const value = parseNodeAttributesAsTags(node.attributes);
  return {
    value,
    attributes: {},
    description: getDescription$1(value, name)
  };
}
function isArray(node) {
  return getArrayChild(node.value) !== void 0;
}
function getArrayChild(value) {
  return value["rdf:Bag"] || value["rdf:Seq"] || value["rdf:Alt"];
}
function parseNodeAsArray(node, name) {
  let items = getArrayChild(node.value).value["rdf:li"];
  const attributes = parseNodeAttributes(node);
  const value = [];
  if (items === void 0) {
    items = [];
  } else if (!Array.isArray(items)) {
    items = [items];
  }
  items.forEach((item) => {
    value.push(parseArrayValue(item));
  });
  return {
    value,
    attributes,
    description: getDescription$1(value, name)
  };
}
function parseArrayValue(item) {
  if (hasNestedSimpleRdfDescription(item)) {
    return parseNodeAsSimpleRdfDescription(item);
  }
  if (hasNestedStructureRdfDescription(item)) {
    return parseNodeAsStructureRdfDescription(item).value;
  }
  if (isCompactStructure(item)) {
    return parseNodeAsCompactStructure(item).value;
  }
  return parseNodeAsSimpleValue(item);
}
function parseNodeAsSimpleValue(node, name) {
  const value = getURIValue(node) || parseXMPObject(node.value);
  return {
    value,
    attributes: parseNodeAttributes(node),
    description: getDescription$1(value, name)
  };
}
function getURIValue(node) {
  return node.attributes && node.attributes["rdf:resource"];
}
const PathRecordTypes = {
  CLOSED_SUBPATH_LENGTH: 0,
  CLOSED_SUBPATH_BEZIER_LINKED: 1,
  CLOSED_SUBPATH_BEZIER_UNLINKED: 2,
  OPEN_SUBPATH_LENGTH: 3,
  OPEN_SUBPATH_BEZIER_LINKED: 4,
  OPEN_SUBPATH_BEZIER_UNLINKED: 5,
  FILL_RULE: 6,
  CLIPBOARD: 7,
  INITIAL_FILL_RULE: 8
};
const PATH_RECORD_SIZE = 24;
const TagNames = {
  // 0x0425: {
  //     name: 'CaptionDigest',
  //     description(dataView) {
  //         let description = '';
  //         for (let i = 0; i < dataView.byteLength; i++) {
  //             const byte = dataView.getUint8(i);
  //             description += padStart(byte.toString(16), 2, '0');
  //         }
  //         return description;
  //     }
  // },
  // Commented out for now to lower bundle size until someone asks for it.
  // 0x043a: {
  //     name: 'PrintInformation',
  //     description: parseDescriptor
  // },
  // 0x043b: {
  //     name: 'PrintStyle',
  //     description: parseDescriptor
  // },
  2e3: {
    name: "PathInformation",
    description: pathResource
  },
  2999: {
    name: "ClippingPathName",
    description(dataView) {
      const [, string] = getPascalStringFromDataView(dataView, 0);
      return string;
    }
  }
};
function pathResource(dataView) {
  const TYPE_SIZE = 2;
  const types = {};
  const paths = [];
  for (let offset = 0; offset < dataView.byteLength; offset += TYPE_SIZE + PATH_RECORD_SIZE) {
    const type = Types.getShortAt(dataView, offset);
    if (PATH_RECORD_TYPES[type]) {
      if (!types[type]) {
        types[type] = PATH_RECORD_TYPES[type].description;
      }
      paths.push({
        type,
        path: PATH_RECORD_TYPES[type].path(dataView, offset + TYPE_SIZE)
      });
    }
  }
  return JSON.stringify({ types, paths });
}
const PATH_RECORD_TYPES = {
  [PathRecordTypes.CLOSED_SUBPATH_LENGTH]: {
    description: "Closed subpath length",
    path: (dataView, offset) => [Types.getShortAt(dataView, offset)]
  },
  [PathRecordTypes.CLOSED_SUBPATH_BEZIER_LINKED]: {
    description: "Closed subpath Bezier knot, linked",
    path: parseBezierKnot
  },
  [PathRecordTypes.CLOSED_SUBPATH_BEZIER_UNLINKED]: {
    description: "Closed subpath Bezier knot, unlinked",
    path: parseBezierKnot
  },
  [PathRecordTypes.OPEN_SUBPATH_LENGTH]: {
    description: "Open subpath length",
    path: (dataView, offset) => [Types.getShortAt(dataView, offset)]
  },
  [PathRecordTypes.OPEN_SUBPATH_BEZIER_LINKED]: {
    description: "Open subpath Bezier knot, linked",
    path: parseBezierKnot
  },
  [PathRecordTypes.OPEN_SUBPATH_BEZIER_UNLINKED]: {
    description: "Open subpath Bezier knot, unlinked",
    path: parseBezierKnot
  },
  [PathRecordTypes.FILL_RULE]: {
    description: "Path fill rule",
    path: () => []
  },
  [PathRecordTypes.INITIAL_FILL_RULE]: {
    description: "Initial fill rule",
    path: (dataView, offset) => [Types.getShortAt(dataView, offset)]
  },
  [PathRecordTypes.CLIPBOARD]: {
    description: "Clipboard",
    path: parseClipboard
  }
};
function parseBezierKnot(dataView, offset) {
  const PATH_POINT_SIZE = 8;
  const path2 = [];
  for (let i = 0; i < PATH_RECORD_SIZE; i += PATH_POINT_SIZE) {
    path2.push(parsePathPoint(dataView, offset + i));
  }
  return path2;
}
function parsePathPoint(dataView, offset) {
  const vertical = getFixedPointNumber(dataView, offset, 8);
  const horizontal = getFixedPointNumber(dataView, offset + 4, 8);
  return [horizontal, vertical];
}
function parseClipboard(dataView, offset) {
  return [
    [
      getFixedPointNumber(dataView, offset, 8),
      // Top
      getFixedPointNumber(dataView, offset + 4, 8),
      // Left
      getFixedPointNumber(dataView, offset + 8, 8),
      // Botton
      getFixedPointNumber(dataView, offset + 12, 8)
      // Right
    ],
    getFixedPointNumber(dataView, offset + 16, 8)
    // Resolution
  ];
}
function getFixedPointNumber(dataView, offset, binaryPoint) {
  const number = Types.getLongAt(dataView, offset);
  const sign = number >>> 31 === 0 ? 1 : -1;
  const integer = (number & 2130706432) >>> 32 - binaryPoint;
  const fraction2 = number & parseInt(strRepeat("1", 32 - binaryPoint), 2);
  return sign * parseFloatRadix(integer.toString(2) + "." + padStart(fraction2.toString(2), 32 - binaryPoint, "0"), 2);
}
const PhotoshopTags = {
  read: read$7
};
const SIGNATURE = "8BIM";
const TAG_ID_SIZE = 2;
const RESOURCE_LENGTH_SIZE = 4;
const SIGNATURE_SIZE = SIGNATURE.length;
function read$7(bytes, includeUnknown) {
  const dataView = getDataView$1(new Uint8Array(bytes).buffer);
  const tags = {};
  let offset = 0;
  while (offset < bytes.length) {
    const signature = getStringFromDataView(dataView, offset, SIGNATURE_SIZE);
    offset += SIGNATURE_SIZE;
    const tagId = Types.getShortAt(dataView, offset);
    offset += TAG_ID_SIZE;
    const { tagName, tagNameSize } = getTagName(dataView, offset);
    offset += tagNameSize;
    const resourceSize = Types.getLongAt(dataView, offset);
    offset += RESOURCE_LENGTH_SIZE;
    if (signature === SIGNATURE) {
      const valueDataView = getDataView$1(dataView.buffer, offset, resourceSize);
      const tag = {
        id: tagId,
        value: getStringFromDataView(valueDataView, 0, resourceSize)
      };
      if (TagNames[tagId]) {
        try {
          tag.description = TagNames[tagId].description(valueDataView);
        } catch (error) {
          tag.description = "<no description formatter>";
        }
        tags[tagName ? tagName : TagNames[tagId].name] = tag;
      } else if (includeUnknown) {
        tags[`undefined-${tagId}`] = tag;
      }
    }
    offset += resourceSize + resourceSize % 2;
  }
  return tags;
}
function getTagName(dataView, offset) {
  const [stringSize, string] = getPascalStringFromDataView(dataView, offset);
  return {
    tagName: string,
    tagNameSize: 1 + stringSize + (stringSize % 2 === 0 ? 1 : 0)
  };
}
const iccTags = {
  "desc": {
    "name": "ICC Description"
  },
  "cprt": {
    "name": "ICC Copyright"
  },
  "dmdd": {
    "name": "ICC Device Model Description"
  },
  "vued": {
    "name": "ICC Viewing Conditions Description"
  },
  "dmnd": {
    "name": "ICC Device Manufacturer for Display"
  },
  "tech": {
    "name": "Technology"
  }
};
const iccProfile = {
  4: {
    "name": "Preferred CMM type",
    "value": (dataView, offset) => getStringFromDataView(dataView, offset, 4),
    "description": (value) => value !== null ? toCompany(value) : ""
  },
  8: {
    "name": "Profile Version",
    "value": (dataView, offset) => {
      return dataView.getUint8(offset).toString(10) + "." + (dataView.getUint8(offset + 1) >> 4).toString(10) + "." + (dataView.getUint8(offset + 1) % 16).toString(10);
    }
  },
  12: {
    "name": "Profile/Device class",
    "value": (dataView, offset) => getStringFromDataView(dataView, offset, 4),
    "description": (value) => {
      switch (value.toLowerCase()) {
        case "scnr":
          return "Input Device profile";
        case "mntr":
          return "Display Device profile";
        case "prtr":
          return "Output Device profile";
        case "link":
          return "DeviceLink profile";
        case "abst":
          return "Abstract profile";
        case "spac":
          return "ColorSpace profile";
        case "nmcl":
          return "NamedColor profile";
        case "cenc":
          return "ColorEncodingSpace profile";
        case "mid ":
          return "MultiplexIdentification profile";
        case "mlnk":
          return "MultiplexLink profile";
        case "mvis":
          return "MultiplexVisualization profile";
        default:
          return value;
      }
    }
  },
  16: {
    "name": "Color Space",
    "value": (dataView, offset) => getStringFromDataView(dataView, offset, 4)
  },
  20: {
    "name": "Connection Space",
    "value": (dataView, offset) => getStringFromDataView(dataView, offset, 4)
  },
  24: {
    "name": "ICC Profile Date",
    "value": (dataView, offset) => parseDate(dataView, offset).toISOString()
  },
  36: {
    "name": "ICC Signature",
    "value": (dataView, offset) => sliceToString$1(dataView.buffer.slice(offset, offset + 4))
  },
  40: {
    "name": "Primary Platform",
    "value": (dataView, offset) => getStringFromDataView(dataView, offset, 4),
    "description": (value) => toCompany(value)
  },
  48: {
    "name": "Device Manufacturer",
    "value": (dataView, offset) => getStringFromDataView(dataView, offset, 4),
    "description": (value) => toCompany(value)
  },
  52: {
    "name": "Device Model Number",
    "value": (dataView, offset) => getStringFromDataView(dataView, offset, 4)
  },
  64: {
    "name": "Rendering Intent",
    "value": (dataView, offset) => dataView.getUint32(offset),
    "description": (value) => {
      switch (value) {
        case 0:
          return "Perceptual";
        case 1:
          return "Relative Colorimetric";
        case 2:
          return "Saturation";
        case 3:
          return "Absolute Colorimetric";
        default:
          return value;
      }
    }
  },
  80: {
    "name": "Profile Creator",
    "value": (dataView, offset) => getStringFromDataView(dataView, offset, 4)
  }
};
function parseDate(dataView, offset) {
  const year = dataView.getUint16(offset);
  const month = dataView.getUint16(offset + 2) - 1;
  const day = dataView.getUint16(offset + 4);
  const hours = dataView.getUint16(offset + 6);
  const minutes = dataView.getUint16(offset + 8);
  const seconds = dataView.getUint16(offset + 10);
  return new Date(Date.UTC(year, month, day, hours, minutes, seconds));
}
function sliceToString$1(slice) {
  return String.fromCharCode.apply(null, new Uint8Array(slice));
}
function toCompany(value) {
  switch (value.toLowerCase()) {
    case "appl":
      return "Apple";
    case "adbe":
      return "Adobe";
    case "msft":
      return "Microsoft";
    case "sunw":
      return "Sun Microsystems";
    case "sgi":
      return "Silicon Graphics";
    case "tgnt":
      return "Taligent";
    default:
      return value;
  }
}
const IccTags = {
  read: read$6
};
const PROFILE_HEADER_LENGTH = 84;
const ICC_TAG_COUNT_OFFSET = 128;
const ICC_SIGNATURE = "acsp";
const TAG_TYPE_DESC = "desc";
const TAG_TYPE_MULTI_LOCALIZED_UNICODE_TYPE = "mluc";
const TAG_TYPE_TEXT = "text";
const TAG_TYPE_SIGNATURE = "sig ";
const TAG_TABLE_SINGLE_TAG_DATA = 12;
function read$6(dataView, iccData, async) {
  if (async && iccData[0].compressionMethod !== COMPRESSION_METHOD_NONE) {
    return readCompressedIcc(dataView, iccData);
  }
  return readIcc(dataView, iccData);
}
function readCompressedIcc(dataView, iccData) {
  if (!compressionMethodIsSupported(iccData[0].compressionMethod)) {
    return {};
  }
  const compressedDataView = new DataView(dataView.buffer.slice(iccData[0].offset, iccData[0].offset + iccData[0].length));
  return decompress(compressedDataView, iccData[0].compressionMethod, "utf-8", "dataview").then(parseTags).catch(() => ({}));
}
function compressionMethodIsSupported(compressionMethod) {
  return compressionMethod === COMPRESSION_METHOD_DEFLATE;
}
function readIcc(dataView, iccData) {
  try {
    const totalIccProfileLength = iccData.reduce((sum, icc) => sum + icc.length, 0);
    const iccBinaryData = new Uint8Array(totalIccProfileLength);
    let offset = 0;
    const buffer = getBuffer(dataView);
    for (let chunkNumber = 1; chunkNumber <= iccData.length; chunkNumber++) {
      const iccDataChunk = iccData.find((x) => x.chunkNumber === chunkNumber);
      if (!iccDataChunk) {
        throw new Error(`ICC chunk ${chunkNumber} not found`);
      }
      const data = buffer.slice(iccDataChunk.offset, iccDataChunk.offset + iccDataChunk.length);
      const chunkData = new Uint8Array(data);
      iccBinaryData.set(chunkData, offset);
      offset += chunkData.length;
    }
    return parseTags(new DataView(iccBinaryData.buffer));
  } catch (error) {
    return {};
  }
}
function getBuffer(dataView) {
  if (Array.isArray(dataView)) {
    return new DataView(Uint8Array.from(dataView).buffer).buffer;
  }
  return dataView.buffer;
}
function iccDoesNotHaveTagCount(buffer) {
  return buffer.length < ICC_TAG_COUNT_OFFSET + 4;
}
function hasTagsData(buffer, tagHeaderOffset) {
  return buffer.length < tagHeaderOffset + TAG_TABLE_SINGLE_TAG_DATA;
}
function parseTags(dataView) {
  const buffer = dataView.buffer;
  const length = dataView.getUint32();
  if (dataView.byteLength !== length) {
    throw new Error("ICC profile length not matching");
  }
  if (dataView.length < PROFILE_HEADER_LENGTH) {
    throw new Error("ICC profile too short");
  }
  const tags = {};
  const iccProfileKeys = Object.keys(iccProfile);
  for (let i = 0; i < iccProfileKeys.length; i++) {
    const offset = iccProfileKeys[i];
    const profileEntry = iccProfile[offset];
    const value = profileEntry.value(dataView, parseInt(offset, 10));
    let description = value;
    if (profileEntry.description) {
      description = profileEntry.description(value);
    }
    tags[profileEntry.name] = {
      value,
      description
    };
  }
  const signature = sliceToString(buffer.slice(36, 40));
  if (signature !== ICC_SIGNATURE) {
    throw new Error("ICC profile: missing signature");
  }
  if (iccDoesNotHaveTagCount(buffer)) {
    return tags;
  }
  const tagCount = dataView.getUint32(128);
  let tagHeaderOffset = 132;
  for (let i = 0; i < tagCount; i++) {
    if (hasTagsData(buffer, tagHeaderOffset)) {
      return tags;
    }
    const tagSignature = getStringFromDataView(dataView, tagHeaderOffset, 4);
    const tagOffset = dataView.getUint32(tagHeaderOffset + 4);
    const tagSize = dataView.getUint32(tagHeaderOffset + 8);
    if (tagOffset > buffer.length) {
      return tags;
    }
    const tagType = getStringFromDataView(dataView, tagOffset, 4);
    if (tagType === TAG_TYPE_DESC) {
      const tagValueSize = dataView.getUint32(tagOffset + 8);
      if (tagValueSize > tagSize) {
        return tags;
      }
      const val = sliceToString(buffer.slice(tagOffset + 12, tagOffset + tagValueSize + 11));
      addTag(tags, tagSignature, val);
    } else if (tagType === TAG_TYPE_MULTI_LOCALIZED_UNICODE_TYPE) {
      const numRecords = dataView.getUint32(tagOffset + 8);
      const recordSize = dataView.getUint32(tagOffset + 12);
      let offset = tagOffset + 16;
      const val = [];
      for (let recordNum = 0; recordNum < numRecords; recordNum++) {
        const languageCode = getStringFromDataView(dataView, offset + 0, 2);
        const countryCode = getStringFromDataView(dataView, offset + 2, 2);
        const textLength = dataView.getUint32(offset + 4);
        const textOffset = dataView.getUint32(offset + 8);
        const text = getUnicodeStringFromDataView(dataView, tagOffset + textOffset, textLength);
        val.push({ languageCode, countryCode, text });
        offset += recordSize;
      }
      if (numRecords === 1) {
        addTag(tags, tagSignature, val[0].text);
      } else {
        const valObj = {};
        for (let valIndex = 0; valIndex < val.length; valIndex++) {
          valObj[`${val[valIndex].languageCode}-${val[valIndex].countryCode}`] = val[valIndex].text;
        }
        addTag(tags, tagSignature, valObj);
      }
    } else if (tagType === TAG_TYPE_TEXT) {
      const val = sliceToString(buffer.slice(tagOffset + 8, tagOffset + tagSize - 7));
      addTag(tags, tagSignature, val);
    } else if (tagType === TAG_TYPE_SIGNATURE) {
      const val = sliceToString(buffer.slice(tagOffset + 8, tagOffset + 12));
      addTag(tags, tagSignature, val);
    }
    tagHeaderOffset = tagHeaderOffset + 12;
  }
  return tags;
}
function sliceToString(slice) {
  return String.fromCharCode.apply(null, new Uint8Array(slice));
}
function addTag(tags, tagSignature, value) {
  if (iccTags[tagSignature]) {
    tags[iccTags[tagSignature].name] = { value, description: value };
  } else {
    tags[tagSignature] = { value, description: value };
  }
}
const SHOT_INFO_AUTO_ROTATE = 27;
const CanonTags = {
  read: read$5,
  SHOT_INFO_AUTO_ROTATE
};
function read$5(dataView, tiffHeaderOffset, offset, byteOrder, includeUnknown) {
  let tags = readIfd(dataView, IFD_TYPE_CANON, tiffHeaderOffset, tiffHeaderOffset + offset, byteOrder, includeUnknown);
  if (tags["ShotInfo"]) {
    tags = objectAssign({}, tags, parseShotInfo(tags["ShotInfo"].value));
    delete tags["ShotInfo"];
  }
  return tags;
}
function parseShotInfo(shotInfoData) {
  const tags = {};
  if (shotInfoData[SHOT_INFO_AUTO_ROTATE] !== void 0) {
    tags["AutoRotate"] = {
      value: shotInfoData[SHOT_INFO_AUTO_ROTATE],
      description: getAutoRotateDescription(shotInfoData[SHOT_INFO_AUTO_ROTATE])
    };
  }
  return tags;
}
function getAutoRotateDescription(autoRotate) {
  if (autoRotate === 0) {
    return "None";
  }
  if (autoRotate === 1) {
    return "Rotate 90 CW";
  }
  if (autoRotate === 2) {
    return "Rotate 180";
  }
  if (autoRotate === 3) {
    return "Rotate 270 CW";
  }
  return "Unknown";
}
const PngFileTags = {
  read: read$4
};
function read$4(dataView, fileDataOffset) {
  return {
    "Image Width": getImageWidth$1(dataView, fileDataOffset),
    "Image Height": getImageHeight$1(dataView, fileDataOffset),
    "Bit Depth": getBitDepth$1(dataView, fileDataOffset),
    "Color Type": getColorType(dataView, fileDataOffset),
    "Compression": getCompression(dataView, fileDataOffset),
    "Filter": getFilter(dataView, fileDataOffset),
    "Interlace": getInterlace(dataView, fileDataOffset)
  };
}
function getImageWidth$1(dataView, fileDataOffset) {
  const OFFSET = 0;
  const SIZE = 4;
  if (fileDataOffset + OFFSET + SIZE > dataView.byteLength) {
    return void 0;
  }
  const value = Types.getLongAt(dataView, fileDataOffset);
  return {
    value,
    description: `${value}px`
  };
}
function getImageHeight$1(dataView, fileDataOffset) {
  const OFFSET = 4;
  const SIZE = 4;
  if (fileDataOffset + OFFSET + SIZE > dataView.byteLength) {
    return void 0;
  }
  const value = Types.getLongAt(dataView, fileDataOffset + OFFSET);
  return {
    value,
    description: `${value}px`
  };
}
function getBitDepth$1(dataView, fileDataOffset) {
  const OFFSET = 8;
  const SIZE = 1;
  if (fileDataOffset + OFFSET + SIZE > dataView.byteLength) {
    return void 0;
  }
  const value = Types.getByteAt(dataView, fileDataOffset + OFFSET);
  return {
    value,
    description: `${value}`
  };
}
function getColorType(dataView, fileDataOffset) {
  const OFFSET = 9;
  const SIZE = 1;
  const COLOR_TYPES = {
    0: "Grayscale",
    2: "RGB",
    3: "Palette",
    4: "Grayscale with Alpha",
    6: "RGB with Alpha"
  };
  if (fileDataOffset + OFFSET + SIZE > dataView.byteLength) {
    return void 0;
  }
  const value = Types.getByteAt(dataView, fileDataOffset + OFFSET);
  return {
    value,
    description: COLOR_TYPES[value] || "Unknown"
  };
}
function getCompression(dataView, fileDataOffset) {
  const OFFSET = 10;
  const SIZE = 1;
  if (fileDataOffset + OFFSET + SIZE > dataView.byteLength) {
    return void 0;
  }
  const value = Types.getByteAt(dataView, fileDataOffset + OFFSET);
  return {
    value,
    description: value === 0 ? "Deflate/Inflate" : "Unknown"
  };
}
function getFilter(dataView, fileDataOffset) {
  const OFFSET = 11;
  const SIZE = 1;
  if (fileDataOffset + OFFSET + SIZE > dataView.byteLength) {
    return void 0;
  }
  const value = Types.getByteAt(dataView, fileDataOffset + OFFSET);
  return {
    value,
    description: value === 0 ? "Adaptive" : "Unknown"
  };
}
function getInterlace(dataView, fileDataOffset) {
  const OFFSET = 12;
  const SIZE = 1;
  const INTERLACE_TYPES = {
    0: "Noninterlaced",
    1: "Adam7 Interlace"
  };
  if (fileDataOffset + OFFSET + SIZE > dataView.byteLength) {
    return void 0;
  }
  const value = Types.getByteAt(dataView, fileDataOffset + OFFSET);
  return {
    value,
    description: INTERLACE_TYPES[value] || "Unknown"
  };
}
const PngTextTags = {
  read: read$3
};
const STATE_KEYWORD = "STATE_KEYWORD";
const STATE_COMPRESSION = "STATE_COMPRESSION";
const STATE_LANG = "STATE_LANG";
const STATE_TRANSLATED_KEYWORD = "STATE_TRANSLATED_KEYWORD";
const STATE_TEXT = "STATE_TEXT";
const COMPRESSION_SECTION_ITXT_EXTRA_BYTE = 1;
const COMPRESSION_FLAG_COMPRESSED = 1;
const EXIF_OFFSET = 6;
function read$3(dataView, pngTextChunks, async, includeUnknown) {
  const tags = {};
  const tagsPromises = [];
  for (let i = 0; i < pngTextChunks.length; i++) {
    const { offset, length, type } = pngTextChunks[i];
    const nameAndValue = getNameAndValue(dataView, offset, length, type, async);
    if (nameAndValue instanceof Promise) {
      tagsPromises.push(nameAndValue.then(({ name, value, description }) => {
        try {
          if (Constants.USE_EXIF && isExifGroupTag(name, value)) {
            return {
              __exif: Tags.read(decodeRawData(value), EXIF_OFFSET, includeUnknown).tags
            };
          } else if (Constants.USE_IPTC && isIptcGroupTag(name, value)) {
            return {
              __iptc: IptcTags.read(decodeRawData(value), 0, includeUnknown)
            };
          } else if (name && !isExifGroupTag(name, value) && !isIptcGroupTag(name, value)) {
            return {
              [name]: {
                value,
                description
              }
            };
          }
        } catch (error) {
        }
        return {};
      }));
    } else {
      const { name, value, description } = nameAndValue;
      if (name) {
        tags[name] = {
          value,
          description
        };
      }
    }
  }
  return {
    readTags: tags,
    readTagsPromise: tagsPromises.length > 0 ? Promise.all(tagsPromises) : void 0
  };
}
function getNameAndValue(dataView, offset, length, type, async) {
  const keywordChars = [];
  const langChars = [];
  let valueChars;
  let parsingState = STATE_KEYWORD;
  let compressionMethod = COMPRESSION_METHOD_NONE;
  for (let i = 0; i < length && offset + i < dataView.byteLength; i++) {
    if (parsingState === STATE_COMPRESSION) {
      compressionMethod = getCompressionMethod({ type, dataView, offset: offset + i });
      if (type === TYPE_ITXT) {
        i += COMPRESSION_SECTION_ITXT_EXTRA_BYTE;
      }
      parsingState = moveToNextState(type, parsingState);
      continue;
    } else if (parsingState === STATE_TEXT) {
      valueChars = new DataView(dataView.buffer.slice(offset + i, offset + length));
      break;
    }
    const byte = dataView.getUint8(offset + i);
    if (byte === 0) {
      parsingState = moveToNextState(type, parsingState);
    } else if (parsingState === STATE_KEYWORD) {
      keywordChars.push(byte);
    } else if (parsingState === STATE_LANG) {
      langChars.push(byte);
    } else ;
  }
  if (compressionMethod !== COMPRESSION_METHOD_NONE && !async) {
    return {};
  }
  const decompressedValueChars = decompress(valueChars, compressionMethod, getEncodingFromType(type));
  if (decompressedValueChars instanceof Promise) {
    return decompressedValueChars.then((_decompressedValueChars) => constructTag(_decompressedValueChars, type, langChars, keywordChars)).catch(() => constructTag("<text using unknown compression>".split(""), type, langChars, keywordChars));
  }
  return constructTag(decompressedValueChars, type, langChars, keywordChars);
}
function getCompressionMethod({ type, dataView, offset }) {
  if (type === TYPE_ITXT) {
    if (dataView.getUint8(offset) === COMPRESSION_FLAG_COMPRESSED) {
      return dataView.getUint8(offset + 1);
    }
  } else if (type === TYPE_ZTXT) {
    return dataView.getUint8(offset);
  }
  return COMPRESSION_METHOD_NONE;
}
function moveToNextState(type, parsingState) {
  if (parsingState === STATE_KEYWORD && [TYPE_ITXT, TYPE_ZTXT].includes(type)) {
    return STATE_COMPRESSION;
  }
  if (parsingState === STATE_COMPRESSION) {
    if (type === TYPE_ITXT) {
      return STATE_LANG;
    }
    return STATE_TEXT;
  }
  if (parsingState === STATE_LANG) {
    return STATE_TRANSLATED_KEYWORD;
  }
  return STATE_TEXT;
}
function getEncodingFromType(type) {
  if (type === TYPE_TEXT || type === TYPE_ZTXT) {
    return "latin1";
  }
  return "utf-8";
}
function constructTag(valueChars, type, langChars, keywordChars) {
  const value = getValue(valueChars);
  return {
    name: getName(type, langChars, keywordChars),
    value,
    description: type === TYPE_ITXT ? getDescription(valueChars) : value
  };
}
function getName(type, langChars, keywordChars) {
  const name = getStringValueFromArray(keywordChars);
  if (type === TYPE_TEXT || langChars.length === 0) {
    return name;
  }
  const lang = getStringValueFromArray(langChars);
  return `${name} (${lang})`;
}
function getValue(valueChars) {
  if (valueChars instanceof DataView) {
    return getStringFromDataView(valueChars, 0, valueChars.byteLength);
  }
  return valueChars;
}
function getDescription(valueChars) {
  return TagDecoder.decode("UTF-8", valueChars);
}
function isExifGroupTag(name, value) {
  return name.toLowerCase() === "raw profile type exif" && value.substring(1, 5) === "exif";
}
function isIptcGroupTag(name, value) {
  return name.toLowerCase() === "raw profile type iptc" && value.substring(1, 5) === "iptc";
}
function decodeRawData(value) {
  const parts = value.match(/\n(exif|iptc)\n\s*\d+\n([\s\S]*)$/);
  return hexToDataView(parts[2].replace(/\n/g, ""));
}
function hexToDataView(hex) {
  const dataView = new DataView(new ArrayBuffer(hex.length / 2));
  for (let i = 0; i < hex.length; i += 2) {
    dataView.setUint8(i / 2, parseInt(hex.substring(i, i + 2), 16));
  }
  return dataView;
}
const PngTags = {
  read: read$2
};
function read$2(dataView, chunkOffsets) {
  const tags = {};
  for (let i = 0; i < chunkOffsets.length; i++) {
    const chunkLength = Types.getLongAt(dataView, chunkOffsets[i] + PNG_CHUNK_LENGTH_OFFSET);
    const chunkType = getStringFromDataView(dataView, chunkOffsets[i] + PNG_CHUNK_TYPE_OFFSET, PNG_CHUNK_TYPE_SIZE);
    if (chunkType === TYPE_PHYS) {
      tags["Pixels Per Unit X"] = getPixelsPerUnitX(dataView, chunkOffsets[i], chunkLength);
      tags["Pixels Per Unit Y"] = getPixelsPerUnitY(dataView, chunkOffsets[i], chunkLength);
      tags["Pixel Units"] = getPixelUnits(dataView, chunkOffsets[i], chunkLength);
    } else if (chunkType === TYPE_TIME) {
      tags["Modify Date"] = getModifyDate(dataView, chunkOffsets[i], chunkLength);
    }
  }
  return tags;
}
function getPixelsPerUnitX(dataView, chunkOffset, chunkLength) {
  const TAG_OFFSET = 0;
  const TAG_SIZE = 4;
  if (!tagFitsInBuffer(dataView, chunkOffset, chunkLength, TAG_OFFSET, TAG_SIZE)) {
    return void 0;
  }
  const value = Types.getLongAt(dataView, chunkOffset + PNG_CHUNK_DATA_OFFSET + TAG_OFFSET);
  return {
    value,
    description: "" + value
  };
}
function getPixelsPerUnitY(dataView, chunkOffset, chunkLength) {
  const TAG_OFFSET = 4;
  const TAG_SIZE = 4;
  if (!tagFitsInBuffer(dataView, chunkOffset, chunkLength, TAG_OFFSET, TAG_SIZE)) {
    return void 0;
  }
  const value = Types.getLongAt(dataView, chunkOffset + PNG_CHUNK_DATA_OFFSET + TAG_OFFSET);
  return {
    value,
    description: "" + value
  };
}
function getPixelUnits(dataView, chunkOffset, chunkLength) {
  const TAG_OFFSET = 8;
  const TAG_SIZE = 1;
  if (!tagFitsInBuffer(dataView, chunkOffset, chunkLength, TAG_OFFSET, TAG_SIZE)) {
    return void 0;
  }
  const value = Types.getByteAt(dataView, chunkOffset + PNG_CHUNK_DATA_OFFSET + TAG_OFFSET);
  return {
    value,
    description: value === 1 ? "meters" : "Unknown"
  };
}
function getModifyDate(dataView, chunkOffset, chunkLength) {
  const TIME_TAG_SIZE = 7;
  if (!tagFitsInBuffer(dataView, chunkOffset, chunkLength, 0, TIME_TAG_SIZE)) {
    return void 0;
  }
  const year = Types.getShortAt(dataView, chunkOffset + PNG_CHUNK_DATA_OFFSET);
  const month = Types.getByteAt(dataView, chunkOffset + PNG_CHUNK_DATA_OFFSET + 2);
  const day = Types.getByteAt(dataView, chunkOffset + PNG_CHUNK_DATA_OFFSET + 3);
  const hours = Types.getByteAt(dataView, chunkOffset + PNG_CHUNK_DATA_OFFSET + 4);
  const minutes = Types.getByteAt(dataView, chunkOffset + PNG_CHUNK_DATA_OFFSET + 5);
  const seconds = Types.getByteAt(dataView, chunkOffset + PNG_CHUNK_DATA_OFFSET + 6);
  return {
    value: [year, month, day, hours, minutes, seconds],
    description: `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)} ${pad(hours, 2)}:${pad(minutes, 2)}:${pad(seconds, 2)}`
  };
}
function tagFitsInBuffer(dataView, chunkOffset, chunkLength, tagOffset, tagSize) {
  return tagOffset + tagSize <= chunkLength && chunkOffset + PNG_CHUNK_DATA_OFFSET + tagOffset + tagSize <= dataView.byteLength;
}
function pad(number, size) {
  return `${"0".repeat(size - ("" + number).length)}${number}`;
}
const Vp8xTags = {
  read: read$1
};
const IMAGE_WIDTH_OFFSET = 4;
const IMAGE_HEIGHT_OFFSET = 7;
function read$1(dataView, chunkOffset) {
  const tags = {};
  const flags = Types.getByteAt(dataView, chunkOffset);
  tags["Alpha"] = getAlpha(flags);
  tags["Animation"] = getAnimation(flags);
  tags["ImageWidth"] = getThreeByteValue(dataView, chunkOffset + IMAGE_WIDTH_OFFSET);
  tags["ImageHeight"] = getThreeByteValue(dataView, chunkOffset + IMAGE_HEIGHT_OFFSET);
  return tags;
}
function getAlpha(flags) {
  const value = flags & 16;
  return {
    value: value ? 1 : 0,
    description: value ? "Yes" : "No"
  };
}
function getAnimation(flags) {
  const value = flags & 2;
  return {
    value: value ? 1 : 0,
    description: value ? "Yes" : "No"
  };
}
function getThreeByteValue(dataView, offset) {
  const value = Types.getByteAt(dataView, offset) + 256 * Types.getByteAt(dataView, offset + 1) + 256 * 256 * Types.getByteAt(dataView, offset + 2) + 1;
  return {
    value,
    description: value + "px"
  };
}
const GifFileTags = {
  read
};
function read(dataView) {
  return {
    "GIF Version": getGifVersion(dataView),
    "Image Width": getImageWidth(dataView),
    "Image Height": getImageHeight(dataView),
    "Global Color Map": getGlobalColorMap(dataView),
    "Bits Per Pixel": getBitDepth(dataView),
    "Color Resolution Depth": getColorResolution(dataView)
  };
}
function getGifVersion(dataView) {
  const OFFSET = 3;
  const SIZE = 3;
  if (OFFSET + SIZE > dataView.byteLength) {
    return void 0;
  }
  const value = getStringFromDataView(dataView, OFFSET, SIZE);
  return {
    value,
    description: value
  };
}
function getImageWidth(dataView) {
  const OFFSET = 6;
  const SIZE = 2;
  if (OFFSET + SIZE > dataView.byteLength) {
    return void 0;
  }
  const value = dataView.getUint16(OFFSET, true);
  return {
    value,
    description: `${value}px`
  };
}
function getImageHeight(dataView) {
  const OFFSET = 8;
  const SIZE = 2;
  if (OFFSET + SIZE > dataView.byteLength) {
    return void 0;
  }
  const value = dataView.getUint16(OFFSET, true);
  return {
    value,
    description: `${value}px`
  };
}
function getGlobalColorMap(dataView) {
  const OFFSET = 10;
  const SIZE = 1;
  if (OFFSET + SIZE > dataView.byteLength) {
    return void 0;
  }
  const byteValue = dataView.getUint8(OFFSET);
  const value = (byteValue & 128) >>> 7;
  return {
    value,
    description: value === 1 ? "Yes" : "No"
  };
}
function getColorResolution(dataView) {
  const OFFSET = 10;
  const SIZE = 1;
  if (OFFSET + SIZE > dataView.byteLength) {
    return void 0;
  }
  const byteValue = dataView.getUint8(OFFSET);
  const value = ((byteValue & 112) >>> 4) + 1;
  return {
    value,
    description: `${value} ${value === 1 ? "bit" : "bits"}`
  };
}
function getBitDepth(dataView) {
  const OFFSET = 10;
  const SIZE = 1;
  if (OFFSET + SIZE > dataView.byteLength) {
    return void 0;
  }
  const byteValue = dataView.getUint8(OFFSET);
  const value = (byteValue & 7) + 1;
  return {
    value,
    description: `${value} ${value === 1 ? "bit" : "bits"}`
  };
}
const COMPRESSION_JPEG = [6, 7, 99];
const Thumbnail = {
  get
};
function get(dataView, thumbnailTags, tiffHeaderOffset) {
  if (hasJpegThumbnail(thumbnailTags)) {
    thumbnailTags.type = "image/jpeg";
    const offset = tiffHeaderOffset + thumbnailTags.JPEGInterchangeFormat.value;
    thumbnailTags.image = dataView.buffer.slice(offset, offset + thumbnailTags.JPEGInterchangeFormatLength.value);
    deferInit(thumbnailTags, "base64", function() {
      return getBase64Image(this.image);
    });
  }
  return thumbnailTags;
}
function hasJpegThumbnail(tags) {
  return tags && (tags.Compression === void 0 || COMPRESSION_JPEG.includes(tags.Compression.value)) && tags.JPEGInterchangeFormat && tags.JPEGInterchangeFormat.value && tags.JPEGInterchangeFormatLength && tags.JPEGInterchangeFormatLength.value;
}
function MetadataMissingError(message) {
  this.name = "MetadataMissingError";
  this.message = message || "No Exif data";
  this.stack = new Error().stack;
}
MetadataMissingError.prototype = new Error();
const exifErrors = {
  MetadataMissingError
};
const ExifReader = {
  load,
  loadView,
  errors: exifErrors
};
function load(data, options = {}) {
  if (isFilePathOrURL(data)) {
    options.async = true;
    return loadFile(data, options).then((fileContents) => loadFromData(fileContents, options));
  }
  if (isBrowserFileObject(data)) {
    options.async = true;
    return loadFileObject(data).then((fileContents) => loadFromData(fileContents, options));
  }
  return loadFromData(data, options);
}
function isFilePathOrURL(data) {
  return typeof data === "string";
}
function loadFile(filename, options) {
  if (/^\w+:\/\//.test(filename)) {
    if (typeof fetch !== "undefined") {
      return fetchRemoteFile(filename, options);
    }
    return nodeGetRemoteFile(filename, options);
  }
  if (isDataUri(filename)) {
    return Promise.resolve(dataUriToBuffer(filename));
  }
  return loadLocalFile(filename, options);
}
function fetchRemoteFile(url, { length } = {}) {
  const options = { method: "GET" };
  if (Number.isInteger(length) && length >= 0) {
    options.headers = {
      range: `bytes=0-${length - 1}`
    };
  }
  return fetch(url, options).then((response) => response.arrayBuffer());
}
function nodeGetRemoteFile(url, { length } = {}) {
  return new Promise((resolve, reject) => {
    const options = {};
    if (Number.isInteger(length) && length >= 0) {
      options.headers = {
        range: `bytes=0-${length - 1}`
      };
    }
    const get2 = requireNodeGet(url);
    get2(url, options, (response) => {
      if (response.statusCode >= 200 && response.statusCode <= 299) {
        const data = [];
        response.on("data", (chunk) => data.push(Buffer.from(chunk)));
        response.on("error", (error) => reject(error));
        response.on("end", () => resolve(Buffer.concat(data)));
      } else {
        reject(`Could not fetch file: ${response.statusCode} ${response.statusMessage}`);
        response.resume();
      }
    }).on("error", (error) => reject(error));
  });
}
function requireNodeGet(url) {
  if (/^https:\/\//.test(url)) {
    return __non_webpack_require__("https").get;
  }
  return __non_webpack_require__("http").get;
}
function isDataUri(filename) {
  return /^data:[^;,]*(;base64)?,/.test(filename);
}
function loadLocalFile(filename, { length } = {}) {
  return new Promise((resolve, reject) => {
    const fs2 = requireNodeFs();
    fs2.open(filename, (error, fd) => {
      if (error) {
        reject(error);
      } else {
        fs2.stat(filename, (error2, stat) => {
          if (error2) {
            reject(error2);
          } else {
            const size = Math.min(stat.size, length !== void 0 ? length : stat.size);
            const buffer = Buffer.alloc(size);
            const options = {
              buffer,
              length: size
            };
            fs2.read(fd, options, (error3) => {
              if (error3) {
                reject(error3);
              } else {
                fs2.close(fd, (error4) => {
                  if (error4) {
                    console.warn(`Could not close file ${filename}:`, error4);
                  }
                  resolve(buffer);
                });
              }
            });
          }
        });
      }
    });
  });
}
function requireNodeFs() {
  try {
    return __non_webpack_require__("fs");
  } catch (error) {
    return void 0;
  }
}
function isBrowserFileObject(data) {
  return typeof File !== "undefined" && data instanceof File;
}
function loadFileObject(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => resolve(readerEvent.target.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}
function loadFromData(data, options) {
  if (isNodeBuffer(data)) {
    data = new Uint8Array(data).buffer;
  }
  return loadView(getDataView(data), options);
}
function isNodeBuffer(data) {
  try {
    return Buffer.isBuffer(data);
  } catch (error) {
    return false;
  }
}
function getDataView(data) {
  try {
    return new DataView(data);
  } catch (error) {
    return new DataView$1(data);
  }
}
function loadView(dataView, {
  expanded = false,
  async = false,
  includeUnknown = false,
  domParser = void 0
} = {
  expanded: false,
  async: false,
  includeUnknown: false,
  domParser: void 0
}) {
  let foundMetaData = false;
  let tags = {};
  const tagsPromises = [];
  const {
    fileType,
    fileDataOffset,
    jfifDataOffset,
    tiffHeaderOffset,
    iptcDataOffset,
    xmpChunks,
    iccChunks,
    mpfDataOffset,
    pngHeaderOffset,
    pngTextChunks,
    pngChunkOffsets,
    vp8xChunkOffset,
    gifHeaderOffset
  } = ImageHeader.parseAppMarkers(dataView, async);
  if (hasFileData(fileDataOffset)) {
    foundMetaData = true;
    const readTags2 = FileTags.read(dataView, fileDataOffset);
    if (expanded) {
      tags.file = readTags2;
    } else {
      tags = objectAssign({}, tags, readTags2);
    }
  }
  if (hasJfifData(jfifDataOffset)) {
    foundMetaData = true;
    const readTags2 = JfifTags.read(dataView, jfifDataOffset);
    if (expanded) {
      tags.jfif = readTags2;
    } else {
      tags = objectAssign({}, tags, readTags2);
    }
  }
  if (hasExifData(tiffHeaderOffset)) {
    foundMetaData = true;
    const { tags: readTags2, byteOrder } = Tags.read(dataView, tiffHeaderOffset, includeUnknown);
    if (readTags2.Thumbnail) {
      tags.Thumbnail = readTags2.Thumbnail;
      delete readTags2.Thumbnail;
    }
    if (expanded) {
      tags.exif = readTags2;
      addGpsGroup(tags);
    } else {
      tags = objectAssign({}, tags, readTags2);
    }
    if (readTags2["IPTC-NAA"] && !hasIptcData(iptcDataOffset)) {
      const readIptcTags = IptcTags.read(readTags2["IPTC-NAA"].value, 0, includeUnknown);
      if (expanded) {
        tags.iptc = readIptcTags;
      } else {
        tags = objectAssign({}, tags, readIptcTags);
      }
    }
    if (readTags2["ApplicationNotes"] && !hasXmpData(xmpChunks)) {
      const readXmpTags = XmpTags.read(getStringValueFromArray(readTags2["ApplicationNotes"].value), void 0, domParser);
      if (expanded) {
        tags.xmp = readXmpTags;
      } else {
        delete readXmpTags._raw;
        tags = objectAssign({}, tags, readXmpTags);
      }
    }
    if (readTags2["ImageSourceData"]) {
      const readPhotoshopTags = PhotoshopTags.read(readTags2["PhotoshopSettings"].value, includeUnknown);
      if (expanded) {
        tags.photoshop = readPhotoshopTags;
      } else {
        tags = objectAssign({}, tags, readPhotoshopTags);
      }
    }
    if (readTags2["ICC_Profile"] && !hasIccData(iccChunks)) {
      const readIccTags = IccTags.read(
        readTags2["ICC_Profile"].value,
        [{
          offset: 0,
          length: readTags2["ICC_Profile"].value.length,
          chunkNumber: 1,
          chunksTotal: 1
        }]
      );
      if (expanded) {
        tags.icc = readIccTags;
      } else {
        tags = objectAssign({}, tags, readIccTags);
      }
    }
    {
      if (hasCanonData(readTags2)) {
        const readCanonTags = CanonTags.read(dataView, tiffHeaderOffset, readTags2["MakerNote"].__offset, byteOrder, includeUnknown);
        if (expanded) {
          tags.makerNotes = readCanonTags;
        } else {
          tags = objectAssign({}, tags, readCanonTags);
        }
      }
    }
    if (readTags2["MakerNote"]) {
      delete readTags2["MakerNote"].__offset;
    }
  }
  if (hasIptcData(iptcDataOffset)) {
    foundMetaData = true;
    const readTags2 = IptcTags.read(dataView, iptcDataOffset, includeUnknown);
    if (expanded) {
      tags.iptc = readTags2;
    } else {
      tags = objectAssign({}, tags, readTags2);
    }
  }
  if (hasXmpData(xmpChunks)) {
    foundMetaData = true;
    const readTags2 = XmpTags.read(dataView, xmpChunks, domParser);
    if (expanded) {
      tags.xmp = readTags2;
    } else {
      delete readTags2._raw;
      tags = objectAssign({}, tags, readTags2);
    }
  }
  if (hasIccData(iccChunks)) {
    foundMetaData = true;
    const readTags2 = IccTags.read(dataView, iccChunks, async);
    if (readTags2 instanceof Promise) {
      tagsPromises.push(readTags2.then(addIccTags));
    } else {
      addIccTags(readTags2);
    }
  }
  if (hasMpfData(mpfDataOffset)) {
    foundMetaData = true;
    const readMpfTags = MpfTags.read(dataView, mpfDataOffset, includeUnknown);
    if (expanded) {
      tags.mpf = readMpfTags;
    } else {
      tags = objectAssign({}, tags, readMpfTags);
    }
  }
  if (hasPngFileData(pngHeaderOffset)) {
    foundMetaData = true;
    const readTags2 = PngFileTags.read(dataView, pngHeaderOffset);
    if (expanded) {
      tags.png = !tags.png ? readTags2 : objectAssign({}, tags.png, readTags2);
      tags.pngFile = readTags2;
    } else {
      tags = objectAssign({}, tags, readTags2);
    }
  }
  if (hasPngTextData(pngTextChunks)) {
    foundMetaData = true;
    const { readTags: readTags2, readTagsPromise } = PngTextTags.read(dataView, pngTextChunks, async, includeUnknown);
    addPngTextTags(readTags2);
    if (readTagsPromise) {
      tagsPromises.push(readTagsPromise.then((tagList) => tagList.forEach(addPngTextTags)));
    }
  }
  if (hasPngData(pngChunkOffsets)) {
    foundMetaData = true;
    const readTags2 = PngTags.read(dataView, pngChunkOffsets);
    if (expanded) {
      tags.png = !tags.png ? readTags2 : objectAssign({}, tags.png, readTags2);
    } else {
      tags = objectAssign({}, tags, readTags2);
    }
  }
  if (hasVp8xData(vp8xChunkOffset)) {
    foundMetaData = true;
    const readTags2 = Vp8xTags.read(dataView, vp8xChunkOffset);
    if (expanded) {
      tags.riff = !tags.riff ? readTags2 : objectAssign({}, tags.riff, readTags2);
    } else {
      tags = objectAssign({}, tags, readTags2);
    }
  }
  if (hasGifFileData(gifHeaderOffset)) {
    foundMetaData = true;
    const readTags2 = GifFileTags.read(dataView, gifHeaderOffset);
    if (expanded) {
      tags.gif = !tags.gif ? readTags2 : objectAssign({}, tags.gif, readTags2);
    } else {
      tags = objectAssign({}, tags, readTags2);
    }
  }
  const thumbnail = Thumbnail.get(dataView, tags.Thumbnail, tiffHeaderOffset);
  if (thumbnail) {
    foundMetaData = true;
    tags.Thumbnail = thumbnail;
  } else {
    delete tags.Thumbnail;
  }
  if (fileType) {
    if (expanded) {
      if (!tags.file) {
        tags.file = {};
      }
      tags.file.FileType = fileType;
    } else {
      tags.FileType = fileType;
    }
    foundMetaData = true;
  }
  if (!foundMetaData) {
    throw new exifErrors.MetadataMissingError();
  }
  if (async) {
    return Promise.all(tagsPromises).then(() => tags);
  }
  return tags;
  function addIccTags(readTags2) {
    if (expanded) {
      tags.icc = readTags2;
    } else {
      tags = objectAssign({}, tags, readTags2);
    }
  }
  function addPngTextTags(readTags2) {
    if (expanded) {
      for (const group of ["exif", "iptc"]) {
        const groupKey = `__${group}`;
        if (readTags2[groupKey]) {
          tags[group] = !tags[group] ? readTags2[groupKey] : objectAssign({}, tags.exif, readTags2[groupKey]);
          delete readTags2[groupKey];
        }
      }
      tags.png = !tags.png ? readTags2 : objectAssign({}, tags.png, readTags2);
      tags.pngText = !tags.pngText ? readTags2 : objectAssign({}, tags.png, readTags2);
    } else {
      tags = objectAssign(
        {},
        tags,
        readTags2.__exif ? readTags2.__exif : {},
        readTags2.__iptc ? readTags2.__iptc : {},
        readTags2
      );
      delete tags.__exif;
      delete tags.__iptc;
    }
  }
}
function hasFileData(fileDataOffset) {
  return fileDataOffset !== void 0;
}
function hasJfifData(jfifDataOffset) {
  return jfifDataOffset !== void 0;
}
function hasExifData(tiffHeaderOffset) {
  return tiffHeaderOffset !== void 0;
}
function addGpsGroup(tags) {
  if (tags.exif) {
    if (tags.exif.GPSLatitude && tags.exif.GPSLatitudeRef) {
      try {
        tags.gps = tags.gps || {};
        tags.gps.Latitude = getCalculatedGpsValue(tags.exif.GPSLatitude.value);
        if (tags.exif.GPSLatitudeRef.value.join("") === "S") {
          tags.gps.Latitude = -tags.gps.Latitude;
        }
      } catch (error) {
      }
    }
    if (tags.exif.GPSLongitude && tags.exif.GPSLongitudeRef) {
      try {
        tags.gps = tags.gps || {};
        tags.gps.Longitude = getCalculatedGpsValue(tags.exif.GPSLongitude.value);
        if (tags.exif.GPSLongitudeRef.value.join("") === "W") {
          tags.gps.Longitude = -tags.gps.Longitude;
        }
      } catch (error) {
      }
    }
    if (tags.exif.GPSAltitude && tags.exif.GPSAltitudeRef) {
      try {
        tags.gps = tags.gps || {};
        tags.gps.Altitude = tags.exif.GPSAltitude.value[0] / tags.exif.GPSAltitude.value[1];
        if (tags.exif.GPSAltitudeRef.value === 1) {
          tags.gps.Altitude = -tags.gps.Altitude;
        }
      } catch (error) {
      }
    }
  }
}
function hasIptcData(iptcDataOffset) {
  return iptcDataOffset !== void 0;
}
function hasXmpData(xmpChunks) {
  return Array.isArray(xmpChunks) && xmpChunks.length > 0;
}
function hasIccData(iccDataOffsets) {
  return Array.isArray(iccDataOffsets) && iccDataOffsets.length > 0;
}
function hasCanonData(tags) {
  return tags["Make"] && tags["Make"].value && Array.isArray(tags["Make"].value) && tags["Make"].value[0] === "Canon" && tags["MakerNote"] && tags["MakerNote"].__offset;
}
function hasMpfData(mpfDataOffset) {
  return mpfDataOffset !== void 0;
}
function hasPngFileData(pngFileDataOffset) {
  return pngFileDataOffset !== void 0;
}
function hasPngTextData(pngTextChunks) {
  return pngTextChunks !== void 0;
}
function hasPngData(pngChunkOffsets) {
  return pngChunkOffsets !== void 0;
}
function hasVp8xData(vp8xChunkOffset) {
  return vp8xChunkOffset !== void 0;
}
function hasGifFileData(gifHeaderOffset) {
  return gifHeaderOffset !== void 0;
}
class ExifProcessor {
  static async processImage(filePath) {
    var _a;
    console.log("Processing image:", filePath);
    try {
      if (!fs.existsSync(filePath)) {
        console.error("File does not exist:", filePath);
        throw new Error("File does not exist");
      }
      const buffer = fs.readFileSync(filePath);
      console.log("File read successfully, size:", buffer.length);
      const tags = await ExifReader.load(buffer);
      console.log("EXIF tags loaded:", Object.keys(tags));
      const gpsData = this.extractGPSData(tags);
      const cameraData = this.extractCameraData(tags);
      const result = {
        exif: {
          latitude: gpsData.latitude,
          longitude: gpsData.longitude,
          error: gpsData.error,
          dateTimeOriginal: ((_a = tags.DateTimeOriginal) == null ? void 0 : _a.description) || null,
          make: cameraData.make,
          model: cameraData.model,
          exposureTime: cameraData.exposureTime,
          fNumber: cameraData.fNumber,
          iso: cameraData.iso,
          focalLength: cameraData.focalLength
        },
        fileData: {
          base64: buffer.toString("base64"),
          mimeType: "image/jpeg",
          fileName: filePath.split("/").pop() || "unknown"
        }
      };
      console.log("Processed image data:", result);
      return result;
    } catch (error) {
      console.error("Error processing image:", error);
      return {
        exif: {
          latitude: null,
          longitude: null,
          error: "Failed to process image",
          dateTimeOriginal: null,
          make: null,
          model: null,
          exposureTime: null,
          fNumber: null,
          iso: null,
          focalLength: null
        },
        fileData: {
          base64: "",
          mimeType: "image/jpeg",
          fileName: "unknown"
        }
      };
    }
  }
  static extractGPSData(tags) {
    var _a, _b, _c, _d;
    if (!((_a = tags.GPSLatitude) == null ? void 0 : _a.description) || !((_b = tags.GPSLongitude) == null ? void 0 : _b.description)) {
      return { latitude: null, longitude: null, error: null };
    }
    try {
      const latDesc = tags.GPSLatitude.description;
      const lonDesc = tags.GPSLongitude.description;
      const latRef = this.extractTagValue((_c = tags.GPSLatitudeRef) == null ? void 0 : _c.value, "N");
      const lonRef = this.extractTagValue((_d = tags.GPSLongitudeRef) == null ? void 0 : _d.value, "E");
      let latitude = parseFloat(latDesc);
      let longitude = parseFloat(lonDesc);
      if (latRef === "S") latitude = -latitude;
      if (lonRef === "W") longitude = -longitude;
      if (isNaN(latitude) || isNaN(longitude)) {
        return {
          latitude: null,
          longitude: null,
          error: "Invalid GPS coordinates found in image"
        };
      }
      return { latitude, longitude, error: null };
    } catch (error) {
      console.error("Error processing GPS coordinates:", error);
      return {
        latitude: null,
        longitude: null,
        error: "Failed to process GPS coordinates"
      };
    }
  }
  static extractCameraData(tags) {
    var _a, _b, _c, _d, _e, _f;
    return {
      make: this.extractTagValue((_a = tags.Make) == null ? void 0 : _a.value),
      model: this.extractTagValue((_b = tags.Model) == null ? void 0 : _b.value),
      exposureTime: ((_c = tags.ExposureTime) == null ? void 0 : _c.description) || null,
      fNumber: ((_d = tags.FNumber) == null ? void 0 : _d.description) ? parseFloat(tags.FNumber.description) : null,
      iso: this.extractTagValue((_e = tags.ISOSpeedRatings) == null ? void 0 : _e.value),
      focalLength: ((_f = tags.FocalLength) == null ? void 0 : _f.description) ? parseFloat(tags.FocalLength.description) : null
    };
  }
  static extractTagValue(value, defaultValue = null) {
    if (!value) return defaultValue;
    if (Array.isArray(value)) return value[0];
    return value;
  }
}
ProtocolManager.registerSchemes();
electron.app.disableHardwareAcceleration();
electron.app.commandLine.appendSwitch("disable-gpu");
electron.app.commandLine.appendSwitch("disable-gpu-compositing");
electron.app.commandLine.appendSwitch("disable-features", "NetworkService,OutOfBlinkCors");
electron.app.commandLine.appendSwitch("disable-http-cache");
try {
  if (fs.existsSync(config.paths.userData)) {
    fs.rmSync(config.paths.userData, { recursive: true, force: true });
  }
  fs.mkdirSync(config.paths.userData, { recursive: true });
  fs.mkdirSync(config.paths.cache, { recursive: true });
} catch (error) {
  console.error("Error managing directories:", error);
}
electron.app.setPath("userData", config.paths.userData);
electron.app.setPath("sessionData", config.paths.userData);
electron.app.setPath("cache", config.paths.cache);
const windowManager = new WindowManager();
electron.app.whenReady().then(() => {
  windowManager.setupSession();
  ProtocolManager.setupProtocols();
  windowManager.createWindow();
  electron.app.on("activate", () => {
    if (windowManager.getMainWindow() === null) {
      windowManager.createWindow();
    }
  });
}).catch(console.error);
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
electron.app.on("quit", () => {
  try {
    fs.rmSync(config.paths.userData, { recursive: true, force: true });
  } catch (error) {
    console.error("Error cleaning up temp directory:", error);
  }
});
electron.ipcMain.handle("select-files", async () => {
  const mainWindow = windowManager.getMainWindow();
  if (!mainWindow) return [];
  const options = {
    properties: ["openFile", "multiSelections"],
    filters: [
      { name: "Images", extensions: config.fileTypes.images }
    ]
  };
  try {
    const result = await electron.dialog.showOpenDialog(mainWindow, options);
    return result.canceled ? [] : result.filePaths;
  } catch (error) {
    console.error("Error selecting files:", error);
    return [];
  }
});
electron.ipcMain.handle("select-export-directory", async () => {
  const mainWindow = windowManager.getMainWindow();
  if (!mainWindow) return null;
  const options = {
    properties: ["openDirectory"]
  };
  try {
    const result = await electron.dialog.showOpenDialog(mainWindow, options);
    return result.canceled ? null : result.filePaths[0];
  } catch (error) {
    console.error("Error selecting directory:", error);
    return null;
  }
});
electron.ipcMain.handle("read-file", async (_, filePath) => {
  return ExifProcessor.processImage(filePath);
});
electron.ipcMain.handle("save-file", async (_, options) => {
  try {
    const dialogOptions = {
      defaultPath: options.defaultFilename,
      filters: options.filters
    };
    const result = await electron.dialog.showSaveDialog(dialogOptions);
    if (result.canceled || !result.filePath) return false;
    await fs.promises.writeFile(result.filePath, options.content, "utf8");
    return true;
  } catch (error) {
    console.error("Error saving file:", error);
    return false;
  }
});
