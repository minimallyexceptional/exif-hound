import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react';

import './app.scss';
import ApplicationStore from './ApplicationStore';

import SplashPage from './pages/SplashPage';
import MapPage from './pages/MapPage';
import DetailPage from './pages/DetailPage';
import ImageLabPage from './pages/ImageLabPage';

const appStore = new ApplicationStore();

const App = (props) => {
    useEffect(() => {
        setTimeout(() => {
            appStore.setCurrentPage(1);
        }, 3000);
    }, []);

    const routePages = (pageENUM) => {
        switch(pageENUM) {
            case 0: 
                return <SplashPage />
            case 1:
                return <MapPage store={appStore} />
            case 2:
                return <DetailPage store={appStore} />
            case 3:
                return <ImageLabPage store={appStore} />
            default:
                return <MapPage store={appStore} />
        }
    }

    return (
        <div id="app">
            {routePages(appStore.currentPage)}
        </div>
    );
}

export default observer(App);