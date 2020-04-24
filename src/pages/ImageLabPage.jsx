import React from 'react';
import { observer } from 'mobx-react';

import ImageLab from '../components/image-lab/ImageLab';

const ImageLabPage = (props) => {
    return (
        <React.Fragment>
            <ImageLab store={props.store}/>
        </React.Fragment>
    );
}

export default observer(ImageLabPage);