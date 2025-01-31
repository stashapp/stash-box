import { FC } from "react";
import { Route, Routes } from "react-router-dom";

import {
  ROUTE_HOME,
  ROUTE_LOGIN,
  ROUTE_USERS,
  ROUTE_PERFORMERS,
  ROUTE_SCENES,
  ROUTE_STUDIOS,
  ROUTE_TAGS,
  ROUTE_EDITS,
  ROUTE_CATEGORIES,
  ROUTE_REGISTER,
  ROUTE_ACTIVATE,
  ROUTE_FORGOT_PASSWORD,
  ROUTE_RESET_PASSWORD,
  ROUTE_SEARCH,
  ROUTE_VERSION,
  ROUTE_SITES,
  ROUTE_DRAFTS,
  ROUTE_NOTIFICATIONS,
} from "src/constants/route";

import Home from "src/pages/home";
import Login from "src/Login";
import Users from "src/pages/users";
import Performers from "src/pages/performers";
import Scenes from "src/pages/scenes";
import Studios from "src/pages/studios";
import Tags from "src/pages/tags";
import Edits from "src/pages/edits";
import Categories from "src/pages/categories";
import RegisterUser from "src/pages/registerUser";
import ActivateUser from "src/pages/activateUser";
import ForgotPassword from "src/pages/forgotPassword";
import ResetPassword from "src/pages/resetPassword";
import Search from "src/pages/search";
import Version from "src/pages/version";
import Sites from "src/pages/sites";
import Drafts from "src/pages/drafts";
import Notifications from "src/pages/notifications";

const Pages: FC = () => (
  <Routes>
    <Route path={ROUTE_HOME} element={<Home />} />
    <Route
      path="/*"
      element={
        <div className="NarrowPage">
          <Routes>
            <Route path={ROUTE_LOGIN} element={<Login />} />
            <Route path={`${ROUTE_USERS}/*`} element={<Users />} />
            <Route path={`${ROUTE_PERFORMERS}/*`} element={<Performers />} />
            <Route path={`${ROUTE_SCENES}/*`} element={<Scenes />} />
            <Route path={`${ROUTE_STUDIOS}/*`} element={<Studios />} />
            <Route path={`${ROUTE_TAGS}/*`} element={<Tags />} />
            <Route path={`${ROUTE_EDITS}/*`} element={<Edits />} />
            <Route path={`${ROUTE_CATEGORIES}/*`} element={<Categories />} />
            <Route path={ROUTE_REGISTER} element={<RegisterUser />} />
            <Route path={ROUTE_ACTIVATE} element={<ActivateUser />} />
            <Route path={ROUTE_FORGOT_PASSWORD} element={<ForgotPassword />} />
            <Route path={ROUTE_RESET_PASSWORD} element={<ResetPassword />} />
            <Route path={ROUTE_SEARCH} element={<Search />} />
            <Route path={ROUTE_VERSION} element={<Version />} />
            <Route path={`${ROUTE_SITES}/*`} element={<Sites />} />
            <Route path={`${ROUTE_DRAFTS}/*`} element={<Drafts />} />
            <Route path={ROUTE_NOTIFICATIONS} element={<Notifications />} />
          </Routes>
        </div>
      }
    />
  </Routes>
);

export default Pages;
