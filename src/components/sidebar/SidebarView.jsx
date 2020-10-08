import { FaInfoCircle, FaImages, FaTrash } from 'react-icons/fa';
import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react';


import './SidebarView.scss';
import EXIFHound from '../../core/exifHound';

const SidebarView = (props) => {

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

    const navigateToImageComparison = (imageObject) => {
        alert('Thumbnail Comparison Feature Coming Soon!');
    }

    const removeImage = (imageObject) => {
        let imageIndex = props.store.images.indexOf(imageObject);
        props.store.images.splice(imageIndex, 1);
    } 

    const renderSidebarItems = (imageArray) => {
        return imageArray.map(image => {
            return (
                <div
                    className="sidebar-item"
                    key={`${image.DateTimeOriginal}-key`}
                >
                    <div 
                        className="image-thumbnail" 
                        onDoubleClick={() => navigateToSelectedImage(image)}
                        onClick={() => setSelectedImage(image)}
                    >
                        <img src={image.ImageData} alt="" />
                    </div>

                    <div className="image-data">
                        <div className="image-datapoint">
                            <span className="image-detail">Time</span> 
                            <span className="image-value">{image.DateTimeOriginal || 'N/A'}</span>
                        </div>

                        <div className="image-datapoint">
                            <span className="image-detail">Latitude</span> 
                            <span className="image-value">{image.GPSLatitude || 'N/A'}</span>
                        </div>

                        <div className="image-datapoint">
                            <span className="image-detail">Longitude</span> 
                            <span className="image-value">{image.GPSLongitude || 'N/A'}</span>
                        </div>
                    </div>
                    <div className="image-toolbar">
                        <button 
                            className="image-toolbar-button"
                            onClick={() => navigateToSelectedImage(image)}
                        >
                            <FaInfoCircle />
                        </button>
                        <button 
                            className="image-toolbar-button"
                            onClick={() => navigateToImageComparison(image)}
                        >
                            <FaImages />
                        </button>
                        <button 
                            className="image-toolbar-button"
                            onClick={() => removeImage(image)}
                        >
                            <FaTrash />
                        </button>
                    </div>
                </div>
            )
        })
    }

    return (
        <div id="sidebar">
            <div className="sidebar-button-bar">
                <input ref={inputRef} type="file" onChange={loadImage} style={{ display: 'none' }} multiple />
                <button className={'sidebar-button'} onClick={clickImage}>Add Images</button>
            </div>
            <div className="sidebar-content">
                {renderSidebarItems(props.store.images)}
            </div>
        </div>
    )
}

export default observer(SidebarView);