import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react';

import './SplashPageView.scss';

const SplashPageView  = (props) => {
    if (props.shown) {
        return (
            <div id="splash-page">
                <div id="logo" />
                <div id="background" />
            </div>
        )
    }

    return null;
}

export default observer(SplashPageView);