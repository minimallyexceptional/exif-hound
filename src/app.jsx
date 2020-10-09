import React, { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { observer } from 'mobx-react';

import './app.scss';
import ApplicationStore from './ApplicationStore';

import SplashPage from './pages/SplashPage';
import MapPage from './pages/MapPage';
import DetailPage from './pages/DetailPage';
import ImageLab from './pages/ImageLab';

const appStore = new ApplicationStore();

const App = (props) => {
    useEffect(() => {
        setTimeout(() => {
            appStore.setCurrentPage(1);
        }, 2000);
    }, []);

    toast.configure({ 
        autoClose: 80,
        draggable: false,
    });

    const routePages = (pageENUM) => {
        switch(pageENUM) {
            case 0: 
                return <SplashPage />
            case 1:
                return <MapPage store={appStore} />
            case 2:
                return <DetailPage store={appStore} />
            case 3:
                return <ImageLab store={appStore} />
            default:
                return <MapPage store={appStore} />
        }
    }

    return (
        <div id="app">
            {routePages(appStore.currentPage)}
            <ToastContainer  
                position={"top-center"}
                autoClose={2000}
                hideProgressBar={false}
            />
        </div>
    );
}

export default observer(App);