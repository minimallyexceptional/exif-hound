import resemble from 'resemblejs';

export default class ImageLab {
    constructor(store) {
        this.store = store;

        resemble.outputSettings({
            errorColor: {
                red: 255,
                green: 0,
                blue: 255
            },
            errorType: "movement",
            transparency: 0.3,
            // scaleToSameSize: true
        })
    }

    analyizeImage(image) {
        resemble(image).onComplete(function(data) {
            console.log(data);
        });
    }

    imageCompare(image1, image2) {
        console.log('DIFFING IMAGES ', image2)
        resemble(image1)
        .compareTo(image2)
        // .setReturnEarlyThreshold(8) // %
        .onComplete(data => {
            /* do something */
            console.log('DATA FROM RESEMBLE ', data);
            this.store.setSelectedImageDiff(data);
        });
    }
}