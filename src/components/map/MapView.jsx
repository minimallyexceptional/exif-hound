import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import L from 'leaflet';

import './MapView.scss';

var map = null;

const MapView  = (props) => {
    
    const [isMounted, setisMounted] = useState(true);

    const inializeMap = () => {
        map = L.map('map').setView([39.7589, -84.1916], 12);

        L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}{r}.{ext}', {
            attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            subdomains: 'abcd',
            minZoom: 0,
            maxZoom: 20,
            ext: 'png'
        }).addTo(map);
    }

    useEffect(() => {
        inializeMap();
        if (props.initalMarker) {
            L.marker([props.initalMarker[0], props.initalMarker[1]]).addTo(map)
        }
    }, [isMounted]);

    useEffect(() => {
        if (props.initalMarker) {
            map.eachLayer(function (layer) {
                map.removeLayer(layer);
            });

            L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}{r}.{ext}', {
                attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                subdomains: 'abcd',
                minZoom: 0,
                maxZoom: 20,
                ext: 'png'
            }).addTo(map);

            map.setView([props.store.selectedImage.gps.position.latitude, props.store.selectedImage.gps.position.longitude], 16);
            let marker = L.marker([props.store.selectedImage.gps.position.latitude, props.store.selectedImage.gps.position.longitude])

            map.addLayer(marker);

        } else if (!props.initalMarker) {
            props.store.images.forEach(image => {
                let marker = L.marker([image.exifData.position.latitude, image.exifData.position.longitude]).addTo(map)
                map.setView([image.exifData.position.latitude, image.exifData.position.longitude], 16);
                
                if (props.popup) {
                    marker.bindPopup(`<img src=${image.getImageData()} style="height: 150px; width: 200px;" />`).openPopup();
                }
            })
        }
    }, [props.store.images.length, props.store.selectedImage])

    return (
        <div id="map"></div>
    )
}

export default observer(MapView);