"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExifProcessor = void 0;
const exifreader_1 = __importDefault(require("exifreader"));
const fs_1 = __importDefault(require("fs"));
class ExifProcessor {
    static async processImage(filePath) {
        console.log('Processing image:', filePath);
        try {
            if (!fs_1.default.existsSync(filePath)) {
                console.error('File does not exist:', filePath);
                throw new Error('File does not exist');
            }
            const buffer = fs_1.default.readFileSync(filePath);
            console.log('File read successfully, size:', buffer.length);
            const tags = await exifreader_1.default.load(buffer);
            console.log('EXIF tags loaded:', Object.keys(tags));
            const result = {
                gps: this.extractGPSData(tags),
                camera: this.extractCameraData(tags),
                fileData: {
                    base64: buffer.toString('base64'),
                    mimeType: 'image/jpeg',
                    fileName: filePath.split('/').pop() || 'unknown'
                }
            };
            console.log('Processed image data:', result);
            return result;
        }
        catch (error) {
            console.error('Error processing image:', error);
            return {
                gps: { latitude: null, longitude: null, error: 'Failed to process image' },
                camera: {
                    make: null,
                    model: null,
                    exposureTime: null,
                    fNumber: null,
                    iso: null,
                    focalLength: null
                }
            };
        }
    }
    static extractGPSData(tags) {
        if (!tags.GPSLatitude?.description || !tags.GPSLongitude?.description) {
            return { latitude: null, longitude: null, error: null };
        }
        try {
            const latDesc = tags.GPSLatitude.description;
            const lonDesc = tags.GPSLongitude.description;
            const latRef = this.extractTagValue(tags.GPSLatitudeRef?.value, 'N');
            const lonRef = this.extractTagValue(tags.GPSLongitudeRef?.value, 'E');
            let latitude = parseFloat(latDesc);
            let longitude = parseFloat(lonDesc);
            if (latRef === 'S')
                latitude = -latitude;
            if (lonRef === 'W')
                longitude = -longitude;
            if (isNaN(latitude) || isNaN(longitude)) {
                return {
                    latitude: null,
                    longitude: null,
                    error: 'Invalid GPS coordinates found in image'
                };
            }
            return { latitude, longitude, error: null };
        }
        catch (error) {
            console.error('Error processing GPS coordinates:', error);
            return {
                latitude: null,
                longitude: null,
                error: 'Failed to process GPS coordinates'
            };
        }
    }
    static extractCameraData(tags) {
        return {
            make: this.extractTagValue(tags.Make?.value),
            model: this.extractTagValue(tags.Model?.value),
            exposureTime: tags.ExposureTime?.description || null,
            fNumber: tags.FNumber?.description ? parseFloat(tags.FNumber.description) : null,
            iso: this.extractTagValue(tags.ISOSpeedRatings?.value),
            focalLength: tags.FocalLength?.description ? parseFloat(tags.FocalLength.description) : null
        };
    }
    static extractTagValue(value, defaultValue = null) {
        if (!value)
            return defaultValue;
        if (Array.isArray(value))
            return value[0];
        return value;
    }
}
exports.ExifProcessor = ExifProcessor;
