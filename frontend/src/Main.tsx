import React, { useState, useRef, useEffect } from "react";
import { Navbar, Nav } from "react-bootstrap";
import { NavLink, useHistory } from "react-router-dom";

import { useMe } from "src/graphql";
import { RoleEnum } from "src/graphql/definitions/globalTypes";
import SearchField, { SearchType } from "src/components/searchField";
import { getPlatformURL, getCredentialsSetting } from "src/utils/createClient";
import { userHref } from "src/utils";
import {
  ROUTE_SCENES,
  ROUTE_PERFORMERS,
  ROUTE_TAGS,
  ROUTE_STUDIOS,
  ROUTE_EDITS,
  ROUTE_LOGOUT,
  ROUTE_LOGIN,
  ROUTE_USERS,
  ROUTE_ACTIVATE,
  ROUTE_RESET_PASSWORD,
  ROUTE_HOME,
  ROUTE_IMPORT,
} from "src/constants/route";
import AuthContext from "./AuthContext";

interface User {
  id: string;
  name: string;
  roles: RoleEnum[] | null;
}

const Main: React.FC = ({ children }) => {
  const history = useHistory();
  const [user, setUser] = useState<User | null>();
  const prevUser = useRef<User | null>();
  const { loading } = useMe({
    onCompleted: (data) => {
      if (data?.me) setUser(data.me);
    },
    onError: () => setUser(null),
  });

  useEffect(() => {
    function noLogin() {
      return (
        history.location.pathname === ROUTE_ACTIVATE ||
        history.location.pathname === ROUTE_RESET_PASSWORD
      );
    }

    if (user === null) {
      if (!noLogin()) {
        history.push(ROUTE_LOGIN);
      }
    } else if (prevUser.current === null) history.push(ROUTE_HOME);
    prevUser.current = user;
  }, [user, history]);

  if (loading) return <></>;

  const isRole = (role: RoleEnum) =>
    (user?.roles ?? []).some((r) => r === RoleEnum.ADMIN || r === role);

  const contextValue = user
    ? {
        authenticated: true,
        user,
        isRole,
      }
    : {
        authenticated: false,
        setUser,
      };

  if (!contextValue.authenticated)
    return (
      <AuthContext.Provider value={contextValue}>
        {children}
      </AuthContext.Provider>
    );

  const handleLogout = async () => {
    const res = await fetch(`${getPlatformURL()}logout`, {
      credentials: getCredentialsSetting(),
    });
    if (res.ok) window.location.href = ROUTE_HOME;
    return false;
  };

  const renderUserNav = () =>
    contextValue.authenticated && (
      <>
        <span>Logged in as</span>
        <NavLink
          to={userHref(contextValue.user!)}
          className="nav-link ml-auto mr-2"
        >
          {contextValue!.user!.name}
        </NavLink>
        {isRole(RoleEnum.ADMIN) && (
          <NavLink exact to={ROUTE_USERS} className="nav-link">
            Users
          </NavLink>
        )}
        <NavLink
          to={ROUTE_LOGOUT}
          onClick={handleLogout}
          className="nav-link mr-4"
        >
          Logout
        </NavLink>
      </>
    );

  return (
    <div>
      <Navbar bg="dark" variant="dark" className="px-4">
        <Nav className="row mr-auto">
          <NavLink exact to={ROUTE_HOME} className="nav-link">
            Home
          </NavLink>
          <NavLink to={ROUTE_PERFORMERS} className="nav-link">
            Performers
          </NavLink>
          <NavLink to={ROUTE_SCENES} className="nav-link">
            Scenes
          </NavLink>
          <NavLink to={ROUTE_STUDIOS} className="nav-link">
            Studios
          </NavLink>
          <NavLink to={ROUTE_TAGS} className="nav-link">
            Tags
          </NavLink>
          <NavLink to={ROUTE_EDITS} className="nav-link">
            Edits
          </NavLink>
          {isRole(RoleEnum.SUBMIT_IMPORT) && isRole(RoleEnum.FINALIZE_IMPORT) && (
            <NavLink to={ROUTE_IMPORT} className="nav-link">
              Import
            </NavLink>
          )}
        </Nav>
        <Nav className="align-items-center">
          {contextValue.authenticated && renderUserNav()}
          <SearchField searchType={SearchType.Combined} navigate showAllLink />
        </Nav>
      </Navbar>
      <div className="StashDBContent container-fluid">
        <AuthContext.Provider value={contextValue}>
          {children}
        </AuthContext.Provider>
      </div>
    </div>
  );
};

export default Main;
