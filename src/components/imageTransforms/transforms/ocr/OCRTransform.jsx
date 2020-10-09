import React from 'react';
import { FaCopy } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { observer } from 'mobx-react';

const OCRTransform = (props) => {

    toast.configure({ 
        autoClose: 80,
        draggable: false,
    });

    const clickCopy = (currentValue) => {
        navigator.clipboard.writeText(currentValue);
        toast(`${currentValue} copied to clipboard`, {
            className: 'exif-hound-toast',
            bodyClassName: "exif-hound-toast-body",
            progressClassName: 'exif-hound-toast-progress-bar'
        });
    }
    
    const renderCopyIcon = (currentItem, currentValue) => {
        return (
            <FaCopy className={'transforms-group-value-copy-button'}  onClick={() => clickCopy(currentItem, currentValue)}/>
        )
    }

    return (
        <div
            className={'transform-group'}
        >
            <div className="transform-header-wrap">
                <h1 className="transform-header">OCR Transform</h1>
            </div>
            <div className="transform-group-content">
                <h1>OCR controls go here</h1>
            </div>
        </div>
    );
}

export default observer(OCRTransform);