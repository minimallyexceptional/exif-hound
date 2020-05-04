import React from 'react';
import { FaInfoCircle, FaImages, FaCopy } from 'react-icons/fa';
import { observer } from 'mobx-react';

import './DetailsView.scss';

import DetailsViewController from './DetailsViewController';

const DetailsView = (props) => {
    const controller = new DetailsViewController();

    const detailValueRef = React.createRef();

    const clickBack = () => {
        props.store.setCurrentPage(1);
        props.store.setSelectedImage(null);
    }

    const clickCopy = (currentValue) => {
        navigator.clipboard.writeText(currentValue);
    }
    
    const renderCopyIcon = (currentValue) => {
        return (
            <FaCopy className={'details-group-value-copy-button'}  onClick={() => clickCopy(currentValue)}/>
        )
    }

    const renderDetailItems = (detailsArray) => {
        return detailsArray.map(group => {
            return (
                <div
                    className={'details-group'}
                >
                    <div className="details-header-wrap">
                        <h1 className="details-header">{group[0]}</h1>
                    </div>
                    <div className="details-group-content">
                        {group[1].map(item => {
                            if (item !== undefined && item !== null) {
                                return (
                                    <p>
                                        <span className="details-group-detail">{`${item[0]}`}</span>
                                        <span ref={detailValueRef} className="details-group-value">{`${item[1] || 'N/A'}`}</span>{renderCopyIcon(item[1])}
                                    </p>
                                );
                            }
                            return null;
                        })}
                    </div>
                </div>
            )
        })
    }

    const renderThumbnail = (sourceImage) => {
        if (sourceImage) {
            return (
                <div className={'details-group'}>
                    <div className="details-header-wrap">
                        <h1 className="details-header">Thumbnail</h1>
                    </div>
                    <div className="details-group-content">
                        <img className="details-thumbnail" src={sourceImage} />
                    </div>
                </div>
            )
        }
    }

    console.log(props.store.selectedImage.ThumbnailData);

    return (
        <div id="details-panel">
            <div className="details-button-bar">
                <button className={'details-button'} onClick={clickBack}>Back</button>
            </div>
            <div className="details-content">
                {renderThumbnail(props.store.selectedImage.ThumbnailData)}
                {renderDetailItems(controller.formatDetailsArray(props.store.selectedImage))}
            </div>
        </div>
    )
}

export default observer(DetailsView);