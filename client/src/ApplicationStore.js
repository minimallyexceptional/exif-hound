import { observable, computed, action, decorate } from "mobx"

class ApplicationStore {
    constructor() {
        this.currentPage = 0;
        this.setCurrentPage = (pageENUM) => {
            this.currentPage = pageENUM;
        }

        this.selectedImage = null;
        this.setSelectedImage = (imageObject) => {
            this.selectedImage = imageObject;
        }
        
        this.images = []
        this.addImage = (imageObject) => {
            this.images.push(imageObject);
        }
    }
}

decorate(ApplicationStore, {
    currentPage: observable,
    setCurrentPage: action,
    selectedImage: observable,
    setSelectedImage: action,
    images: observable,
    addImage: action
})

export default ApplicationStore;