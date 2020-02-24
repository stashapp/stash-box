import { hot } from 'react-hot-loader/root';
import React from 'react';
import { ApolloProvider } from '@apollo/react-hooks';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import createClient from './utils/createClient';
import Login from './Login';
import Main from './Main';
import Home from './components/home';
import Admin from './components/admin';
import { User, UserAdd, UserEdit, UserPassword } from './components/user';
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

import './App.scss';

// Set fontawesome/free-solid-svg as default fontawesome icons
library.add(fas);

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
                        <Route exact path="/login">
                            <Login />
                        </Route>
                        <Route exact path="/admin">
                            <Admin />
                        </Route>
                        <Route exact path="/users/add">
                            <UserAdd />
                        </Route>
                        <Route exact path="/users/change-password">
                            <UserPassword />
                        </Route>
                        <Route exact path="/users/:username">
                            <User />
                        </Route>
                        <Route exact path="/users/:username/edit">
                            <UserEdit />
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
