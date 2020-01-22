import { Words, Project } from 'arwes';
import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react';

import './MapView.scss';
import MapViewController from './MapViewController';

const controller = new MapViewController();

const MapView  = (props) => {

    const [isMounted, setisMounted] = useState(true);
    const [noData, setNoData] = useState(false);

    const mapRef = React.createRef();

    useEffect(() => {
        if (props.initalMarker[0] && props.initalMarker[1]) {
            controller.initalizeMap('map', props.initalMarker[0], props.initalMarker[1], 12);
        } else {
           return;
        }
    }, [isMounted]);

    useEffect(() => {
        if (props.multiMarker) {
            props.store.images.forEach(image => {
                if (image.GPSLatitude && image.GPSLongitude) {
                    controller.addMarkerWithPopupToMap(
                        image.GPSLatitude, 
                        image.GPSLongitude,
                        `<img class="image-marker-popup" src=${image.ImageData} />`,
                        false,
                        true,
                        16
                    );
                } else {
                    return;
                }
            })
        } else {
            if (props.currentMarker[0] && props.currentMarker[1]) {
                controller.reInitalizeMap();
                controller.addMarkerToMap(
                    props.currentMarker[0], 
                    props.currentMarker[1],
                    true,
                    16
                );
            } else {
                controller.reInitalizeMap();
            }
        }
    }, [props.store.images.length])

    useEffect(() => {
        if (props.store.selectedImage && props.store.selectedImage.GPSLatitude && props.store.selectedImage.GPSLongitude) {
            setNoData(false);
            controller.setView(
                props.store.selectedImage.GPSLatitude,
                props.store.selectedImage.GPSLongitude,
                16
            )
        }
        if (props.store.selectedImage && props.store.selectedImage.GPSLatitude && props.store.selectedImage.GPSLongitude && !props.multiMarker) {
            setNoData(false);
            controller.reInitalizeMap();
            controller.addMarkerToMap(
                props.store.selectedImage.GPSLatitude, 
                props.store.selectedImage.GPSLongitude,
                true,
                16
            );
        } else if (props.store.selectedImage && !props.store.selectedImage.GPSLatitude && !props.store.selectedImage.GPSLongitude && !props.multiMarker) {
            setNoData(true);
            controller.reInitalizeMap();
        }
    }, [props.store.selectedImage])

    useEffect(() => {
        if (noData === true) {
            mapRef.current.style.opacity = 0.2;
            mapRef.current.style.pointerEvents = 'none';
        } else {
            mapRef.current.style.opacity = 1;
            mapRef.current.style.pointerEvents = 'auto';
        }
    }, [noData]);

    return <div ref={mapRef} id="map"></div>
}

export default observer(MapView);