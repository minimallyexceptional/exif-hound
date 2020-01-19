import loadImage from 'blueimp-load-image';

import EXIFParser from './parsers/exifParser';
import EXIFImageFactory from './factories/exifImageFactory';

export default class EXIFHound {
    constructor() {
        this.imageElement = null;
        this.exifData = null;

        this.exifParser = new EXIFParser();
        this.imageFactory = new EXIFImageFactory();

        this.loadImage = this.loadImage.bind(this);
    }

    loadImage(event, callback) {
        let loadingImage = loadImage(
            event.target.files[0],
            (img, data) => {
                this.imageElement = img;
                this.exifData = data.exif;
                
                let newDataObject = this.exifParser.parseExif(data.exif);
                let exifImageClass = this.imageFactory.createImage(img, newDataObject)

                callback(exifImageClass);
            },
            { meta: true, noRevoke: true } // Options
        );

        if (loadingImage) {
            return;
        } else {
            throw new Error('Please upload a proper image file!');
        }

    }
}