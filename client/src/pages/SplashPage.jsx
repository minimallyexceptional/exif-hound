import React from 'react';
import { observer } from 'mobx-react';

import SplashPageView from '../components/splash/SplashPageView';

const SplashPage = (props) => {
    return (
        <SplashPageView shown={true} />
    );
}

export default observer(SplashPage);