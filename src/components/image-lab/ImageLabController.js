import ImageLab from "../../image-lab/imageLab";
import EXIFHound from '../../core/exifHound';
import { blobToDataURL } from 'blob-util';

export default class ImageLabController {
    constructor(store) {
        this.imageLab = new ImageLab(store);
        this.hound = new EXIFHound(store);
        this.store = store;
    }

    analyizeImage(image) {
        this.imageLab.analyizeImage(image);
    }
    
    compareImages(image1, image2) {
        this.imageLab.imageCompare(image1, image2);
    }
}