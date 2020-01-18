import GPSFormatter from '../formatters/gpsFormatter';

export default class EXIFParser {
    constructor() {
        this.exifObject = {};
        this.gpsFormatter = new GPSFormatter();
    }
    parseExif(exifData) {

        this.exifObject.dateTimeOriginal = exifData[0x9003];
        this.exifObject.latitude = this.gpsFormatter.formatCoordaniteArray(exifData[0x0002], exifData[0x0001]);
        this.exifObject.longitude = this.gpsFormatter.formatCoordaniteArray(exifData[0x0004], exifData[0x0003]);
        this.exifObject.position = this.gpsFormatter.formatPosition(this.exifObject.latitude, this.exifObject.longitude);

        return this.exifObject;
    }
}