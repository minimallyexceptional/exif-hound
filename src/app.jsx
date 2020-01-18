import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react';
var L = require('leaflet');

import { ThemeProvider, createTheme, Arwes, Row, Col, Button } from 'arwes';

import EXIFHound from './core/exifHound';

let hound = new EXIFHound();

var map = null;

const App = (props) => {

    let appStore = props.store;
    
    const [mounted, setMounted] = useState(true);

    console.log('IMAGES ', appStore.images);

    useEffect(() => {
        console.log('USING EFFECT')
        init();
    }, [mounted]);

    const init = () => {
        map = L.map('map');

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
    }

    useEffect(() => {
        appStore.images.forEach(exifImage => {
            map.setView([exifImage.exifData.position.latitude, exifImage.exifData.position.longitude], 13);
            L.marker([exifImage.exifData.position.latitude, exifImage.exifData.position.longitude]).addTo(map)
                .bindPopup('Image Taken Here!')
                .openPopup();
        })
    })

    const loadFile = (e) => {
        hound.loadImage(e, (exifImage) => {
            console.log('DATA FROM HOUND ', exifImage);
            appStore.addImage(exifImage);

            console.log(appStore.images);
        });
    }

    const renderImages = (images) => {
        return images.map(image =>  {
            return (
                <div>
                    Latitude: {image.exifData.latitude} <br/>
                    Longitude: {image.exifData.longitude}
                </div>
            );
        });
    }

    const renderMap = () => {
        return (
            <div id="map"></div>
        );
    }

    return (
        <ThemeProvider theme={createTheme()}>
            <Arwes >
                <Row>
                    <Col s={12} m={12}>
                        <input onChange={loadFile} type="file" />
                        <Button animate onClick={null}>Sniff EXIF</Button>
                    </Col>
                </Row>
                <Row>
                    <Col s={12} m={6}>
                        <h1>Image</h1>
                        <div id="image">
                            {renderImages(appStore.images)}
                        </div>
                    </Col>
                    <Col s={12} m={6}>
                        <h1>Map</h1>
                        {renderMap()}
                    </Col>
                </Row>
            </Arwes>
        </ThemeProvider>
    );
}

export default observer(App);