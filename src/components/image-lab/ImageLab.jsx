import React from 'react';
import { observer } from 'mobx-react';
import { FaChevronCircleRight, FaChevronCircleLeft } from "react-icons/fa";

import './ImageLab.scss'

const ImageLab = (props) => {

    const navigateToPreviousPage = (store) => {
            store.setCurrentPage(1);
            store.setSelectedImage(null);
    }

    const navigateToNextImage = (store) => {
        let currentIndex = store.images.indexOf(store.selectedImage);
        let maxIndex = store.images.length;

        if (currentIndex + 1 < maxIndex && maxIndex > 1) {
            store.setSelectedImage(store.images[currentIndex + 1]);
        } else if (currentIndex + 1 === maxIndex) {
            store.setSelectedImage(store.images[0]);
        }
    }

    const navigateToPreviousImage = (store) => {
        let currentIndex = store.images.indexOf(store.selectedImage);
        let maxIndex = store.images.length;

        if (currentIndex - 1 > -1) {
            store.setSelectedImage(store.images[currentIndex - 1]);
        } else if (currentIndex === 0) {
            store.setSelectedImage(store.images[maxIndex - 1]);
        }
    }

    const renderSelectedImage = (selectedImage) => {
        if (selectedImage) {
            return (
                <img className={'details-image'} src={props.store.selectedImage.ImageElement.src} />
            );
        }
    }

    const renderThumnailImage = (thumbnailImage) => {
        if (thumbnailImage) {
            return (
                <img className={'details-image'} src={props.store.selectedImage.ThumbnailData} />
            );
        }
    }

    return (
        <React.Fragment>
            <div className="image-lab">
                <button className="image-lab-back-button" onClick={() => navigateToPreviousPage(props.store)}>
                    back
                </button>
                <div className="image-lab-image">
                    <div className="image-lab-section">
                        <label>Thumbnail</label>
                        {renderThumnailImage(props.store.selectedImage)}

                    </div>
                    <div className="image-lab-section">
                        <label>Current Image</label>
                        {renderSelectedImage(props.store.selectedImage)}

                    </div>
                    <div className="image-lab-section">
                        <label>Difference</label>
                        {renderSelectedImage(props.store.selectedImage)}

                    </div>
                </div>
                <div className="image-lab-navigation">
                    <div className="navigation-button-section">
                        <button 
                            className="navigation-button"
                            onClick={() => navigateToPreviousImage(props.store)}
                        >
                            <FaChevronCircleLeft/>
                        </button>
                        <span className="navigation-progress">
                            {`${props.store.images.indexOf(props.store.selectedImage)}/${props.store.images.length}`}
                        </span>
                        <button 
                            className="navigation-button"
                            onClick={() => navigateToNextImage(props.store)}
                        >
                            <FaChevronCircleRight/>
                        </button>
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
}

export default observer(ImageLab);