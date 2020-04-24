import React from 'react';
import { observer } from 'mobx-react';
import { FaChevronCircleRight, FaChevronCircleLeft } from "react-icons/fa";

import ImagePreview from '../components/image-preview/ImagePreview';
import SidebarView from '../components/sidebar/SidebarView';

const ImageLabPage = (props) => {
    return (
        <React.Fragment>
            <div className="image-lab-container">
                <ImagePreview store={props.store}/>
            </div>
        </React.Fragment>
    );
}

export default observer(ImageLabPage);