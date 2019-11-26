import { hot } from 'react-hot-loader/root';
import React from 'react';
import { ApolloProvider } from '@apollo/react-hooks';
import { Router } from '@reach/router';
import createClient from './utils/createClient';
import Login from './Login';
import Main from './Main';
import Home from './components/home';
import Performers from './components/performers';
import Performer from './components/performer';
import PerformerEdit from './components/performerEdit';
import PerformerAdd from './components/performerAdd';
import Scenes from './components/scenes';
import Scene from './components/scene';
import SceneEdit from './components/sceneEdit';
import SceneAdd from './components/sceneAdd';
import Studio from './components/studio';
import Studios from './components/studios';
import StudioEdit from './components/studioEdit';
import StudioAdd from './components/studioAdd';

import 'bootstrap/dist/css/bootstrap.min.css';
import './App.scss';

const client = createClient();

const App: React.FC = () => (
    <ApolloProvider client={client}>
        <Router>
            <Main path="/">
                <Home path="/" />
                <Login path="/login" />
                <Performers path="/performers" />
                <Performer path="/performer/:id" />
                <PerformerAdd path="/performer/add" />
                <PerformerEdit path="/performer/:id/edit" />
                <Scene path="/scene/:id" />
                <Scenes path="/scenes" />
                <SceneEdit path="/scene/:id/edit" />
                <SceneAdd path="/scene/add" />
                <Studio path="/studio/:id" />
                <Studios path="/studios" />
                <StudioEdit path="/studio/:id/edit" />
                <StudioAdd path="/studio/add" />
            </Main>
        </Router>
    </ApolloProvider>
);

export default hot(App);
