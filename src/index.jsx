import React from 'react';
import ReactDOM from 'react-dom';

import './index.scss';

import App from './app';
import ApplicationStore from './appStore';

let appStore = new ApplicationStore();

ReactDOM.render(
    <App store={appStore} />,
    document.getElementById('app')
);