import { Button, Words, Project, Image} from 'arwes';
import React from 'react';
import { observer } from 'mobx-react';

import './DetailsView.scss';

import DetailsViewController from './DetailsViewController';

const DetailsView  = (props) => {
    const controller = new DetailsViewController();

    const clickBack = () => {
        props.store.setCurrentPage(1);
        props.store.setSelectedImage(null);
    }

    const renderDetailItems = (detailsArray) => {
        return detailsArray.map(group => {
            return (
                <Project
                    className={'details-group'}
                    animate
                    header={group[0]}
                >
                    {anim => group[1].map(item => {
                        if (item !== undefined && item !== null) {
                        return <p>
                                <Words animate show={anim.entered}>
                                    {`${item[0]}: ${item[1] || 'N/A'}`}
                                </Words>
                            </p>
                        }

                        return null;
                    })}
                </Project>
            )
        })
    }

    const renderThumbnail = (sourceImage) => {
        return (
            <Project
                className={'details-group'}
                animate
                header={'Thumbnail'}
            >
                 <Image className="details-thumbnail"  animate resources={sourceImage} />
            </Project>
        )
    }

    console.log(props.store.selectedImage.ThumbnailData);

    return (
        <div id="details-panel">
            <div className="details-button-bar">
                <Button className={'details-button'} onClick={clickBack}>Back</Button>
            </div>
            <div className="details-content">
                {renderThumbnail(props.store.selectedImage.ThumbnailData)}
                {renderDetailItems(controller.formatDetailsArray(props.store.selectedImage))}
            </div>
        </div>
    )
}

export default observer(DetailsView);