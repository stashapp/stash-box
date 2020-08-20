import React, { useState, useRef, useEffect } from "react";
import { useQuery } from "@apollo/client";
import { Navbar, Nav } from "react-bootstrap";
import { NavLink, useHistory } from "react-router-dom";
import { loader } from "graphql.macro";
import SearchField, { SearchType } from "src/components/searchField";
import { Me } from "src/definitions/Me";
import { RoleEnum } from "src/definitions/globalTypes";
import { getPlatformURL, getCredentialsSetting } from "src/utils/createClient";
import AuthContext from "./AuthContext";

const ME = loader("src/queries/Me.gql");

interface User {
  id: string;
  name: string;
  roles: RoleEnum[] | null;
}

const Main: React.FC = ({ children }) => {
  const history = useHistory();
  const [user, setUser] = useState<User | null>();
  const prevUser = useRef<User | null>();
  const { loading } = useQuery<Me>(ME, {
    onCompleted: (data) => {
      if (data?.me) setUser(data.me);
    },
    onError: () => setUser(null),
  });

  useEffect(() => {
    if (user === null) history.push("/login");
    else if (prevUser.current === null) history.push("/");
    prevUser.current = user;
  }, [user, history]);

  if (loading) return <div>Loading...</div>;

  const isRole = (role: string) =>
    (user?.roles ?? []).includes(role as RoleEnum);

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
    if (res.ok) window.location.href = "/";
    return false;
  };

  const renderUserNav = () =>
    contextValue.authenticated && (
      <>
        <span>Logged in as</span>
        <NavLink
          to={`/users/${contextValue!.user!.name}`}
          className="nav-link ml-auto mr-2"
        >
          {contextValue!.user!.name}
        </NavLink>
        {isRole("ADMIN") && (
          <NavLink exact to="/admin" className="nav-link">
            Admin
          </NavLink>
        )}
        <NavLink to="/logout" onClick={handleLogout} className="nav-link">
          Logout
        </NavLink>
      </>
    );

  return (
    <div>
      <Navbar bg="dark" variant="dark" className="px-4">
        <Nav className="row mr-auto">
          <NavLink exact to="/" className="nav-link">
            Home
          </NavLink>
          <NavLink to="/performers" className="nav-link">
            Performers
          </NavLink>
          <NavLink to="/scenes" className="nav-link">
            Scenes
          </NavLink>
          <NavLink to="/studios" className="nav-link">
            Studios
          </NavLink>
          <NavLink to="/tags" className="nav-link">
            Tags
          </NavLink>
          <NavLink to="/edits" className="nav-link">
            Edits
          </NavLink>
        </Nav>
        <Nav className="align-items-center">
          {contextValue.authenticated && renderUserNav()}
          <SearchField searchType={SearchType.Combined} />
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
