import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import { ThemeProvider, createTheme, Arwes, Row, Col, Button } from 'arwes';

import './app.scss';
import ApplicationStore from './appStore';

import MapView from './components/map/MapView'
import SidebarView from './components/sidebar/SidebarView';
import SplashPageView from './components/splash/SplashPageView';

const appStore = new ApplicationStore();

const App = (props) => {
    
    const [ isSplash, setIsSplash ] = useState(true)

    useEffect(() => {
        setTimeout(() => {
            setIsSplash(false);
        }, 3000);
    }, [isSplash]);

    const getTheme = () => {
        return createTheme({
            color: {
                primary: { base: 'white' }
            }
        });
    }

    return (
        <ThemeProvider theme={getTheme()}>
            <Arwes >
                <div id="app">
                    <div className="sidebar-container">
                        <SidebarView store={appStore} />
                    </div>
                    <div className="map-container">
                        <MapView store={appStore}/>
                    </div>
                </div>
                <SplashPageView shown={isSplash} />
            </Arwes>
        </ThemeProvider>
    );
}

export default observer(App);