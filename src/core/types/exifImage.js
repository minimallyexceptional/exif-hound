import DataFormatter from "../formatters/dataFormatter";
import { imgSrcToBlob } from 'blob-util'

export default class EXIFImage {
    constructor(imageElement, exifDataObject) {
        this.imageElement = imageElement;
        this.exifData = exifDataObject;
        this.dateTimeOriginal = exifDataObject.dateTimeOriginal;
        this.gps = {
            position: exifDataObject.position
        };

        this.dataFormatter = new DataFormatter();
    }

    getImageElement() {
        return this.imageElement;
    }

    getImageData() {
        return this.imageElement.src;
    }

    getExifData() {
        return this.exifData;
    }

    getLatitude() {
        return this.gps.position.latitude;
    }

    getLongitude() {
        return this.gps.position.longitude;
    }

    getDateTimeOriginal() {
        return this.dateTimeOriginal;
    }
}