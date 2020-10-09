import React from 'react';
import { observer } from 'mobx-react';

import ImageViewer from '../components/imageViewer/ImageViewer';
import ImageTransforms from '../components/imageTransforms/ImageTransforms';

const ImageLabPage = (props) => {

    const renderSelectedImage = (selectedImage) => {
        if (selectedImage) {
            return <ImageViewer selectedImage={props.store.selectedImage.ImageElement.src} />;
        }
    }

    return (
        <React.Fragment>
            <div className="image-lab-details-container">
                <ImageTransforms store={props.store}/>
            </div>
            <div className="image-lab-container">
                <div className="side-split-container">
                    <div className="side-split-section-image-full">
                        {renderSelectedImage(props.store.selectedImage)}
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
}

export default observer(ImageLabPage);