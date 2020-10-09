import React from 'react';
import { toast } from 'react-toastify';
import { observer } from 'mobx-react';

import OCRTransform from './transforms/ocr/OCRTransform';

import './ImageTransforms.scss';

const ImageTransforms = (props) => {
    toast.configure({ 
        autoClose: 80,
        draggable: false,
    });

    const clickBack = () => {
        props.store.setCurrentPage(1);
        props.store.setSelectedImage(null);
    }

    return (
        <div id="transform-panel">
            <div className="transform-button-bar">
                <button className={'transform-button'} onClick={clickBack}>Back</button>
            </div>
            <div className="transform-content">
                <OCRTransform store={props.store}/>
            </div>
        </div>
    )
}

export default observer(ImageTransforms);