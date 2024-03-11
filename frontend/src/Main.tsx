import { FC, useEffect } from "react";
import { Navbar, Nav, Button, Badge } from "react-bootstrap";
import { NavLink, useLocation, useNavigate, Link } from "react-router-dom";
import { faBell, faBook, faUser } from "@fortawesome/free-solid-svg-icons";
import { faBell as faBellOutlined} from "@fortawesome/free-regular-svg-icons";

import SearchField, { SearchType } from "src/components/searchField";
import { getPlatformURL, getCredentialsSetting } from "src/utils/createClient";
import { isAdmin, canEdit, userHref, setCachedUser } from "src/utils";
import { useAuth } from "src/hooks";
import { Icon } from "src/components/fragments";
import { useConfig, useUnreadNotificationsCount } from "src/graphql";
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
  ROUTE_REGISTER,
  ROUTE_FORGOT_PASSWORD,
  ROUTE_SITES,
  ROUTE_DRAFTS,
  ROUTE_NOTIFICATIONS,
} from "src/constants/route";
import AuthContext from "./AuthContext";

interface Props {
  children?: React.ReactNode;
}

const Main: FC<Props> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { loading, user } = useAuth();
  const { data: unreadNotifications } = useUnreadNotificationsCount();
  const notificationCount = unreadNotifications?.getUnreadNotificationCount || null;
  const { data: configData } = useConfig();

  const guidelinesURL = configData?.getConfig.guidelines_url;

  useEffect(() => {
    if (loading || user) return;

    if (
      location.pathname !== ROUTE_ACTIVATE &&
      location.pathname !== ROUTE_REGISTER &&
      location.pathname !== ROUTE_LOGIN &&
      location.pathname !== ROUTE_FORGOT_PASSWORD &&
      location.pathname !== ROUTE_RESET_PASSWORD
    ) {
      navigate(ROUTE_LOGIN);
    }
  }, [loading, user, location, navigate]);

  const contextValue = {
    authenticated: user !== undefined,
    user,
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
    setCachedUser();
    if (res.ok) window.location.href = ROUTE_LOGIN;
    return false;
  };

  const renderUserNav = () =>
    contextValue.authenticated &&
    contextValue.user && (
      <>
        <Link to={ROUTE_NOTIFICATIONS}>
          <Button variant="link" className="NotificationBadge">
            <Icon icon={notificationCount ? faBell : faBellOutlined} />
            { notificationCount && <Badge bg="danger" className="ms-1">{ notificationCount }</Badge> }
          </Button>
        </Link>
        <NavLink
          to={userHref(contextValue.user)}
          className="nav-link ms-auto me-2"
        >
          <Icon icon={faUser} className="me-2" />
          {contextValue.user.name}
        </NavLink>
        {isAdmin(user) && (
          <NavLink to={ROUTE_USERS} className="nav-link">
            Users
          </NavLink>
        )}
        <NavLink
          to={ROUTE_LOGOUT}
          onClick={handleLogout}
          className="nav-link me-4"
        >
          Logout
        </NavLink>
      </>
    );

  return (
    <div>
      <Navbar bg="dark" variant="dark" className="px-4">
        <Nav className="me-auto">
          <NavLink to={ROUTE_HOME} className="nav-link">
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
          {canEdit(user) && (
            <NavLink to={ROUTE_DRAFTS} className="nav-link">
              Drafts
            </NavLink>
          )}
          {isAdmin(user) && (
            <NavLink to={ROUTE_SITES} className="nav-link">
              Sites
            </NavLink>
          )}
          {guidelinesURL && (
            <a
              href={guidelinesURL}
              target="_blank"
              rel="noopener noreferrer"
              className="nav-link"
            >
              <Icon icon={faBook} className="mx-2" />
              Guidelines
            </a>
          )}
        </Nav>
        <Nav className="align-items-center">
          {contextValue.authenticated && renderUserNav()}
          <SearchField searchType={SearchType.Combined} nav showAllLink />
        </Nav>
      </Navbar>
      <AuthContext.Provider value={contextValue}>
        <main className="MainContent container-fluid">{children}</main>
      </AuthContext.Provider>
    </div>
  );
};

export default Main;
