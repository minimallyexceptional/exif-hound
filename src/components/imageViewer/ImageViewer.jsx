import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react';

import './ImageViewer.scss';
import ImageViewerController from './ImageViewerController';

const controller = new ImageViewerController();

const ImageViewer  = (props) => {

    const [isMounted, setisMounted] = useState(true);

    const viewerRef = React.createRef();

    useEffect(() => {
        if (props.selectedImage) {
            controller.init('seaDragon', props.selectedImage);
        } else {
           return;
        }
    }, [isMounted]);

    useEffect(() => {
        if (props.selectedImage) {
            controller.setCurrentImage(props.selectedImage)
        }
    }, [props.selectedImage])

    return (
        <div className="image-viewer">
            <div ref={viewerRef} id="seaDragon"></div>
        </div>
    );
}

export default observer(ImageViewer);