import React from 'react';
import { observer } from 'mobx-react';
import { FaChevronCircleRight, FaChevronCircleLeft } from "react-icons/fa";

import './ImagePreview.scss'

const ImagePreview = (props) => {

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

    return (
        <React.Fragment>
            <div className="image-preview">
                <div className="image-preview-image">
                    {renderSelectedImage(props.store.selectedImage)}
                </div>
                <div className="image-preview-navigation">
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

export default observer(ImagePreview);