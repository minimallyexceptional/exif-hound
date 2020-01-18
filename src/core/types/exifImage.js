export default class EXIFImage {
    constructor(imageElement, exifDataObject) {
        this.imageElement = imageElement;
        this.exifData = exifDataObject;
    }

    getImageElement() {
        return this.imageElement;
    }

    getExifData() {
        return this.exifData;
    }
}