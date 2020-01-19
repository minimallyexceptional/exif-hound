import React from 'react';
import { observer } from 'mobx-react';

import MapView from '../components/map/MapView'
import SidebarView from '../components/sidebar/SidebarView';

const MapPage = (props) => {
    return (
        <React.Fragment>
            <div className="sidebar-container">
                <SidebarView store={props.store} />
            </div>
            <div className="map-container">
                <MapView store={props.store} popup={true} initalMarker={false}/>
            </div>
        </React.Fragment>
    );
}

export default observer(MapPage);