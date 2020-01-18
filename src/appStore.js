import { observable, computed, action, decorate } from "mobx"

class ApplicationStore {
    constructor() {
        this.images = []
        this.addImage = (imageObject) => {
            this.images.push(imageObject);
        }
    }
}

decorate(ApplicationStore, {
    images: observable,
    addImage: action
})

export default ApplicationStore;