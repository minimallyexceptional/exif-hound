import { Image, Button } from 'arwes';
import React from 'react';
import { observer } from 'mobx-react';
import { FaChevronCircleRight, FaChevronCircleLeft } from "react-icons/fa";

import MapView from '../components/map/MapView'
import DetailsView from '../components/details/DetailsView';

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
                <Image className={'details-image'} animate resources={props.store.selectedImage.ImageElement.src}>
                    <Button className={'details-image-navigation-button'} onClick={() => navigateToPreviousImage(props.store)}><FaChevronCircleLeft /></Button>
                    {`${props.store.images.indexOf(props.store.selectedImage) + 1}/${props.store.images.length}`}
                    <Button className={'details-image-navigation-button'} onClick={() => navigateToNextImage(props.store)}><FaChevronCircleRight /></Button>
                </Image>
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
                <div className="side-split-section">
                    {renderSelectedImage(props.store.selectedImage)}
                </div>
                <div className="side-split-section">
                    {renderMapView(props.store.selectedImage)}
                </div>
            </div>
        </React.Fragment>
    );
}

export default observer(DetailPage);