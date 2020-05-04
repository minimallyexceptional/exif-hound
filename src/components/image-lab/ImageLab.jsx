import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import { FaChevronCircleRight, FaChevronCircleLeft } from "react-icons/fa";

import ImageLabController from './ImageLabController';
import './ImageLab.scss'
import { control } from 'leaflet';

const ImageLab = (props) => {

    let inputRef = React.createRef();
    
    const [isMounted, setisMounted] = useState(true);

    const controller = new ImageLabController(props.store);

    useEffect(() => {
        console.log('image lab mounted')
        controller.analyizeImage(props.store.selectedImage.ImageDataURL);
        controller.compareImages(props.store.selectedImage.ImageData, props.store.selectedImage.ThumbnailData);
    }, [isMounted]);

    const navigateToPreviousPage = (store) => {
            store.setCurrentPage(1);
            store.setSelectedImage(null);
    }

    const onCompareClicked = (e) => {
        // console.log('EVENT IN CONTROLLER ', e);
        // controller.compareImages(e, props.store.selectedImage.ImageData);
    }

    const clickImage = () => {
        inputRef.current.click();
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

    const renderSelectedImageDiff = (selectedImageDiff) => {
        console.log('GETTING SELECTED IMAGE DIFF ', selectedImageDiff)
        if (selectedImageDiff) {
            return (
                <img className={'details-image'} src={selectedImageDiff.getImageDataUrl()} />
            );
        }
    }

    const renderImageDiffStats = (stats) => {
        if (stats) {
            return (
                <React.Fragment>
                    <span className="navigation-progress">
                        {`Missmatch Percentage: ${stats.misMatchPercentage}`}
                    </span>
                    <span className="navigation-progress">
                        {`Height Difference: ${stats.dimensionDifference.height} px`}
                    </span>
                    <span className="navigation-progress">
                        {`Width Difference: ${stats.dimensionDifference.width} px`}
                    </span>
                </React.Fragment>
            )
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
                        <label>Current Image</label>
                        {renderSelectedImage(props.store.selectedImage)}

                    </div>
                    <div className="image-lab-section">
                        <label>Thumbnail Comparison</label>
                        {renderSelectedImageDiff(props.store.selectedImageDiff)}
                    </div>
                </div>
                <div className="image-lab-navigation">
                    <div className="navigation-button-section">
                        {renderImageDiffStats(props.store.selectedImageDiff)}
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
}

export default observer(ImageLab);