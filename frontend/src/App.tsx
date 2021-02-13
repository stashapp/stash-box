import React from "react";
import { ApolloProvider } from "@apollo/client";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import { library } from "@fortawesome/fontawesome-svg-core";
import { fas } from "@fortawesome/free-solid-svg-icons";

import {
  ROUTE_HOME,
  ROUTE_LOGIN,
  ROUTE_ADMIN,
  ROUTE_ADMIN_ADD,
  ROUTE_USER,
  ROUTE_USER_EDIT,
  ROUTE_USER_PASSWORD,
  ROUTE_PERFORMER,
  ROUTE_PERFORMERS,
  ROUTE_PERFORMER_ADD,
  ROUTE_PERFORMER_EDIT,
  ROUTE_PERFORMER_MERGE,
  ROUTE_SCENE,
  ROUTE_SCENE_ADD,
  ROUTE_SCENES,
  ROUTE_SCENE_EDIT,
  ROUTE_STUDIO,
  ROUTE_STUDIO_ADD,
  ROUTE_STUDIOS,
  ROUTE_STUDIO_EDIT,
  ROUTE_TAG,
  ROUTE_TAGS,
  ROUTE_TAG_ADD,
  ROUTE_TAG_MERGE,
  ROUTE_TAG_EDIT,
  ROUTE_CATEGORIES,
  ROUTE_EDITS,
  ROUTE_EDIT,
  ROUTE_REGISTER,
  ROUTE_ACTIVATE,
  ROUTE_FORGOT_PASSWORD,
  ROUTE_RESET_PASSWORD,
  ROUTE_SEARCH,
} from "src/constants/route";

import Login from "./Login";
import Main from "./Main";
import createClient from "./utils/createClient";
import Home from "./components/home";
import Admin from "./components/admin";
import { User, UserAdd, UserEdit, UserPassword } from "./components/user";
import Performers from "./components/performers";
import Performer from "./components/performer";
import PerformerEdit from "./components/performerEdit";
import PerformerAdd from "./components/performerAdd";
import PerformerMerge from "./components/performerMerge";
import Scenes from "./components/scenes";
import Scene from "./components/scene";
import SceneEdit from "./components/sceneEdit";
import SceneAdd from "./components/sceneAdd";
import Studio from "./components/studio";
import Studios from "./components/studios";
import StudioEdit from "./components/studioEdit";
import StudioAdd from "./components/studioAdd";
import Tag from "./components/tag";
import Tags from "./components/tags";
import TagAdd from "./components/tagAdd";
import TagEdit from "./components/tagEdit";
import TagMerge from "./components/tagMerge";
import Edit from "./components/edit";
import Edits from "./components/edits";
import Register from "./components/register";
import Categories from "./components/categories";
import Search from "./components/search";

import "./App.scss";
import ActivateNewUserPage from "./components/activateNewUser/ActivateNewUser";
import ForgotPassword from "./components/forgotPassword";
import ResetPassword from "./components/resetPassword";

// Set fontawesome/free-solid-svg as default fontawesome icons
library.add(fas);

const client = createClient();

const App: React.FC = () => (
  <ApolloProvider client={client}>
    <BrowserRouter>
      <Route path="/">
        <Main>
          <Switch>
            <Route exact path={ROUTE_HOME}>
              <Home />
            </Route>
            <Route exact path={ROUTE_LOGIN}>
              <Login />
            </Route>
            <Route exact path={ROUTE_ADMIN}>
              <Admin />
            </Route>
            <Route exact path={ROUTE_ADMIN_ADD}>
              <UserAdd />
            </Route>
            <Route exact path={ROUTE_USER_PASSWORD}>
              <UserPassword />
            </Route>
            <Route exact path={ROUTE_USER}>
              <User />
            </Route>
            <Route exact path={ROUTE_USER_EDIT}>
              <UserEdit />
            </Route>
            <Route exact path={ROUTE_PERFORMERS}>
              <Performers />
            </Route>
            <Route exact path={ROUTE_PERFORMER_ADD}>
              <PerformerAdd />
            </Route>
            <Route exact path={ROUTE_PERFORMER}>
              <Performer />
            </Route>
            <Route exact path={ROUTE_PERFORMER_EDIT}>
              <PerformerEdit />
            </Route>
            <Route exact path={ROUTE_PERFORMER_MERGE}>
              <PerformerMerge />
            </Route>
            <Route exact path={ROUTE_SCENE_ADD}>
              <SceneAdd />
            </Route>
            <Route exact path={ROUTE_SCENE}>
              <Scene />
            </Route>
            <Route exact path={ROUTE_SCENES}>
              <Scenes />
            </Route>
            <Route exact path={ROUTE_SCENE_EDIT}>
              <SceneEdit />
            </Route>
            <Route exact path={ROUTE_STUDIO_ADD}>
              <StudioAdd />
            </Route>
            <Route exact path={ROUTE_STUDIO}>
              <Studio />
            </Route>
            <Route exact path={ROUTE_STUDIOS}>
              <Studios />
            </Route>
            <Route exact path={ROUTE_STUDIO_EDIT}>
              <StudioEdit />
            </Route>
            <Route exact path={ROUTE_TAGS}>
              <Tags />
            </Route>
            <Route exact path={ROUTE_TAG_ADD}>
              <TagAdd />
            </Route>
            <Route exact path={ROUTE_TAG_MERGE}>
              <TagMerge />
            </Route>
            <Route exact path={ROUTE_TAG_EDIT}>
              <TagEdit />
            </Route>
            <Route exact path={ROUTE_TAG}>
              <Tag />
            </Route>
            <Route exact path="/categories*">
              <Categories />
            </Route>
            <Route exact path={ROUTE_EDITS}>
              <Edits />
            </Route>
            <Route exact path={ROUTE_EDIT}>
              <Edit />
            </Route>
            <Route exact path={ROUTE_REGISTER}>
              <Register />
            </Route>
            <Route exact path={ROUTE_ACTIVATE}>
              <ActivateNewUserPage />
            </Route>
            <Route exact path={ROUTE_FORGOT_PASSWORD}>
              <ForgotPassword />
            </Route>
            <Route exact path={ROUTE_RESET_PASSWORD}>
              <ResetPassword />
            </Route>
            <Route exact path={ROUTE_SEARCH}>
              <Search />
            </Route>
          </Switch>
        </Main>
      </Route>
    </BrowserRouter>
  </ApolloProvider>
);

export default App;
