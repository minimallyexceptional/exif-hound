import React from 'react';
import { observer } from 'mobx-react';

import MapView from '../components/map/MapView'
import SidebarView from '../components/sidebar/SidebarView';
import DetailsView from '../components/details/DetailsView';

const DetailPage = (props) => {

    const renderSelectedImage = (selectedImage) => {
        if (selectedImage) {
            return <img src={props.store.selectedImage.imageElement.src} alt=""/>
        }
    }

    const renderMapView = (selectedImage) => {
        if (selectedImage) {
            return <MapView store={props.store} popup={false} initalMarker={[props.store.selectedImage.gps.position.latitude, props.store.selectedImage.gps.position.longitude]} />
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