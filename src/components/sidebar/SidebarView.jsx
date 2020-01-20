import { ThemeProvider, createTheme, Arwes, Row, Col, Button, Frame } from 'arwes';
import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react';

import './SidebarView.scss';
import EXIFHound from '../../core/exifHound';

const SidebarView  = (props) => {

    let inputRef = React.createRef();

    const hound = new EXIFHound(props.store);

    useEffect(() => {
    }, [props.store.images.length])

    const clickImage = () => {
        inputRef.current.click();
    }

    const loadImage = (e) => {
        hound.loadMultipleImages(e);
    }

    const setSelectedImage = (imageObject) => {
        props.store.setSelectedImage(imageObject);
    }

    const navigateToSelectedImage = (imageObject) => {
        props.store.setSelectedImage(imageObject);
        props.store.setCurrentPage(2);
    }

    const renderSidebarItems = (imageArray) => {
        return imageArray.map(image => {
            return (
                <Frame
                    className={'sidebar-frame'}
                    show={true}
                    animate={true}
                    level={3}
                    corners={4}
                    layer='primary'
                    onClick={() => setSelectedImage(image)}
                    onDoubleClick={() => navigateToSelectedImage(image)}
                >
                <div className="sidebar-item">
                    <div className="image-thumbnail">
                        <img src={image.ImageData} alt=""/>
                    </div>
                    <div className="image-data">
                        <span className="image-stat">Time: {image.DateTimeOriginal || 'N/A'}</span>
                        <span className="image-stat">Lat: {image.GPSLatitude || 'N/A'}</span>
                        <span className="image-stat">Lon: {image.GPSLongitude || 'N/A'}</span>
                    </div>
                </div>
            </Frame>
            )
        })
    }

    return (
        <div id="sidebar">
            <div className="sidebar-button-bar">
                <input ref={inputRef} type="file" onChange={loadImage} style={{ display: 'none' }} multiple />
                <Button className={'sidebar-button'} onClick={clickImage}>Add Image</Button>
            </div>
            <div className="sidebar-content">
                {renderSidebarItems(props.store.images)}
            </div>
        </div>
    )
}

export default observer(SidebarView);