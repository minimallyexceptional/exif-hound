import React from 'react';
import ReactDOM from 'react-dom';

import Analytics from 'analytics'
import googleAnalytics from '@analytics/google-analytics'

import './index.scss';
import 'leaflet-css';

import App from './app';
import ApplicationStore from './ApplicationStore';

const appStore = new ApplicationStore();

const analytics = Analytics({
    app: 'EXIF-Hound',
    version: 0,
    plugins: [
      googleAnalytics({
        trackingId: 'UA-125044509-1',
      })
    ]
})

analytics.page()

ReactDOM.render(
    <App store={appStore} />,
    document.getElementById('root')
);