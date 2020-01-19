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
    }, [isMounted]);

    useEffect(() => {        
        props.store.images.forEach(image => {
            let marker = L.marker([image.exifData.position.latitude, image.exifData.position.longitude]).addTo(map)
            marker.bindPopup(`<img src=${image.getImageData()} style="height: 150px; width: 200px;" />`).openPopup();
            map.setView([image.exifData.position.latitude, image.exifData.position.longitude], 16);
        })
    }, [props.store.images.length])

    return (
        <div id="map"></div>
    )
}

export default observer(MapView);