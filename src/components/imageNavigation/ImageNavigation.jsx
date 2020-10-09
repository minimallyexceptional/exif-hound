import React from 'react';
import { observer } from 'mobx-react';
import { FaChevronCircleRight, FaChevronCircleLeft } from "react-icons/fa";

import './ImageNavigation.scss';

const ImageNavigation  = (props) => {

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
    
    return (
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
    );
}

export default observer(ImageNavigation);