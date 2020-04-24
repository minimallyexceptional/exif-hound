import React from 'react';
import { observer } from 'mobx-react';
import { FaChevronCircleRight, FaChevronCircleLeft } from "react-icons/fa";

import MapView from '../components/map/MapView'
import DetailsView from '../components/details/DetailsView';
import ImagePreview from '../components/image-preview/ImagePreview';

const DetailPage = (props) => {

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

    const renderMapView = (selectedImage) => {
        if (selectedImage) {
            return <MapView 
                store={props.store} 
                popup={false} 
                initalMarker={[39.7589, -84.1916]}
                currentMarker={[props.store.selectedImage.GPSLatitude, props.store.selectedImage.GPSLongitude]} 
                multiMarker={false} 
            />
        }
    }

    return (
        <React.Fragment>
            <div className="exif-details-container">
                <DetailsView store={props.store}/>
            </div>
            <div className="side-split-container">
                <ImagePreview store={props.store}/>
                <div className="side-split-section-map">
                    {renderMapView(props.store.selectedImage)}
                </div>
            </div>
        </React.Fragment>
    );
}

export default observer(DetailPage);