import EXIFImage from '../types/exifImage'

import GPSFormatter from '../formatters/gpsFormatter';
import DataFormatter from "../formatters/dataFormatter";

export default class EXIFImageFactory {
    constructor() {
        this.image = null;

        this.gpsFormatter = new GPSFormatter();
        this.dataFormatter = new DataFormatter();
    }
    createImage(imageElement, exifDataObject) {
        this.image = new EXIFImage();

        // Parsed Values
        this.latitudeString = this.parseLatitudeString(exifDataObject);
        this.longitudeString = this.parseLongitudeString(exifDataObject);

        // Image Values
        this.image.imageElement = imageElement || null;
        this.image.imageData = imageElement.src || null;

        // Time and Date
        this.image.DateTimeOriginal = exifDataObject.DateTimeOriginal || null;
        this.image.DateTime = exifDataObject.DateTime || null;
        this.image.DateTimeDigitized = exifDataObject.DateTimeDigitized || null;

        // GPS
        this.image.GPSLatitude = this.parseLatitude(this.latitudeString, this.longitudeString) || null;
        this.image.GPSLongitude = this.parseLongitude(this.latitudeString, this.longitudeString) || null;

        return this.image;
    }

    parseLatitudeString(exifDataObject) {
        if (exifDataObject.GPSLatitude) {
            return this.gpsFormatter.formatCoordaniteArray(
                [exifDataObject.GPSLatitude[0], 
                exifDataObject.GPSLatitude[1], 
                exifDataObject.GPSLatitude[2]], 
                exifDataObject.GPSLatitudeRef
            );
        } else {
            return null;
        }
    }

    parseLongitudeString(exifDataObject) {
        if (exifDataObject.GPSLongitude) {
            return this.gpsFormatter.formatCoordaniteArray([
                exifDataObject.GPSLongitude[0], 
                exifDataObject.GPSLongitude[1], 
                exifDataObject.GPSLongitude[2]], 
                exifDataObject.GPSLongitudeRef
            );
        } else {
            return null;
        }
    }

    parseLatitude(lat, lon) {
        if (lat && lon) {
            return this.gpsFormatter.formatPosition(lat, lon).getLatitude();
        } else {
            return null;
        }
    }

    parseLongitude(lat, lon) {
        if (lat && lon) {
            return this.gpsFormatter.formatPosition(lat, lon).getLongitude();
        } else {
            return null;
        }
    }
    

    parsePosition(lat, lon) {
        if (lat && lon) {
            return this.gpsFormatter.formatPosition(this.latitude, this.longitude);
        } else {
            return {
                latitude: null,
                longitude: null
            }
        }
    }
}