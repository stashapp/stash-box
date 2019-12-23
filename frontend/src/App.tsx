import { hot } from 'react-hot-loader/root';
import React from 'react';
import { ApolloProvider } from '@apollo/react-hooks';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import createClient from './utils/createClient';
/* import Login from './Login'; */
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
        <BrowserRouter>
            <Route path="/">
                <Main>
                    <Switch>
                        <Route exact path="/">
                            <Home />
                        </Route>
                        <Route exact path="/performers">
                            <Performers />
                        </Route>
                        <Route exact path="/performers/add">
                            <PerformerAdd />
                        </Route>
                        <Route exact path="/performers/:id">
                            <Performer />
                        </Route>
                        <Route exact path="/performers/:id/edit">
                            <PerformerEdit />
                        </Route>
                        <Route exact path="/scenes/add">
                            <SceneAdd />
                        </Route>
                        <Route exact path="/scenes/:id">
                            <Scene />
                        </Route>
                        <Route exact path="/scenes">
                            <Scenes />
                        </Route>
                        <Route exact path="/scenes/:id/edit">
                            <SceneEdit />
                        </Route>
                        <Route exact path="/studios/add">
                            <StudioAdd />
                        </Route>
                        <Route exact path="/studios/:id">
                            <Studio />
                        </Route>
                        <Route exact path="/studios">
                            <Studios />
                        </Route>
                        <Route exact path="/studios/:id/edit">
                            <StudioEdit />
                        </Route>
                    </Switch>
                </Main>
            </Route>
        </BrowserRouter>
    </ApolloProvider>
);

export default hot(App);
