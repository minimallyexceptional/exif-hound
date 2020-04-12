import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import { ThemeProvider, createTheme, Arwes, Row, Col, Button } from 'arwes';

import './app.scss';
import ApplicationStore from './ApplicationStore';

import SplashPage from './pages/SplashPage';
import MapPage from './pages/MapPage';
import DetailPage from './pages/DetailPage';

const appStore = new ApplicationStore();

const App = (props) => {
    useEffect(() => {
        setTimeout(() => {
            appStore.setCurrentPage(1);
        }, 3000);
    }, []);

    const getTheme = () => {
        return createTheme({});
    }

    const routePages = (pageENUM) => {
        switch(pageENUM) {
            case 0: 
                return <SplashPage />
            case 1:
                return <MapPage store={appStore} />
            case 2:
                return <DetailPage store={appStore} />
            default:
                return <MapPage store={appStore} />
        }
    }

    return (
        <ThemeProvider theme={getTheme()}>
            <Arwes >
                <div id="app">
                    {routePages(appStore.currentPage)}
                </div>
            </Arwes>
        </ThemeProvider>
    );
}

export default observer(App);