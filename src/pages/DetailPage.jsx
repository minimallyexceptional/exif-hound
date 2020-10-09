import React from 'react';
import { observer } from 'mobx-react';

import MapView from '../components/map/MapView'
import DetailsView from '../components/details/DetailsView';
import ImageViewer from '../components/imageViewer/ImageViewer';
import ImageNavigation from '../components/imageNavigation/ImageNavigation';

const DetailPage = (props) => {

    const renderSelectedImage = (selectedImage) => {
        if (selectedImage) {
            return <ImageViewer selectedImage={props.store.selectedImage.ImageElement.src} />;
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
                <div className="side-split-section-image">
                    {renderSelectedImage(props.store.selectedImage)}
                </div>
                <div className="side-split-section-navigation">
                    <ImageNavigation store={props.store} />
                </div>
                <div className="side-split-section-map">
                    {renderMapView(props.store.selectedImage)}
                </div>
            </div>
        </React.Fragment>
    );
}

export default observer(DetailPage);