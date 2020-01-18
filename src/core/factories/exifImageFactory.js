import EXIFImage from '../types/exifImage'

export default class EXIFImageFactory {
    createImage(imageElement, exifDataObject) {
        return new EXIFImage(imageElement, exifDataObject);
    }
}