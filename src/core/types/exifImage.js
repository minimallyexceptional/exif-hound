export default class EXIFImage {
    constructor() {
        // Image Values
        this.imageElement = null;
        this.imageData = null;

        // Time and Date
        this.DateTimeOriginal = null;
        this.DateTime = null;
        this.DateTimeDigitized = null;

        // GPS
        this.GPSLatitude = null;
        this.GPSLongitude = null;
    }

    getImageElement() {
        return this.imageElement || null;
    }

    getImageData() {
        return this.imageData || null;
    }

    getLatitude() {
        return this.GPSLatitude || null;
    }

    getLongitude() {
        return this.GPSLongitude || null;
    }

    getDateTimeOriginal() {
        return this.DateTimeOriginal || null;
    }
    
    getDateTime() {
        return this.DateTime || null;
    }
    
    getDateTimeDigitized() {
        return this.DateTimeDigitized || null;
    }
}