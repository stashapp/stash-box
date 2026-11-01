import { faBell as faBellOutlined } from "@fortawesome/free-regular-svg-icons";
import { faBell, faBook, faUser } from "@fortawesome/free-solid-svg-icons";
import { Link, useRouter } from "@tanstack/react-router";
import { type FC, useMemo } from "react";
import { Badge, Button, Nav, Navbar } from "react-bootstrap";
import { Icon } from "src/components/fragments";
import SearchField, { SearchType } from "src/components/searchField";
import {
  ROUTE_ADMIN,
  ROUTE_DRAFTS,
  ROUTE_EDITS,
  ROUTE_HOME,
  ROUTE_IMAGE_REVIEW,
  ROUTE_LOGIN,
  ROUTE_LOGOUT,
  ROUTE_NOTIFICATIONS,
  ROUTE_PERFORMERS,
  ROUTE_SCENES,
  ROUTE_SITES,
  ROUTE_STUDIOS,
  ROUTE_TAGS,
} from "src/constants/route";
import { useConfig, useUnreadNotificationsCount } from "src/graphql";
import { useAuth } from "src/hooks";
import { canEdit, canModerate, isAdmin, setCachedUser } from "src/utils";
import { getCredentialsSetting, getPlatformURL } from "src/utils/createClient";
import AuthContext from "./context";

interface Props {
  children?: React.ReactNode;
}

const Main: FC<Props> = ({ children }) => {
  const router = useRouter();
  const { user } = useAuth();
  const { data: unreadNotifications } = useUnreadNotificationsCount(!user);
  const unreadCounts = unreadNotifications?.getUnreadNotificationCount;
  const notificationCount = unreadCounts?.total || null;
  const hasUrgent = (unreadCounts?.urgent ?? 0) > 0;
  const { data: configData } = useConfig();

  const guidelinesURL = configData?.getConfig.guidelines_url;

  const contextValue = useMemo(
    () => ({
      authenticated: user !== undefined,
      user,
    }),
    [user],
  );

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
    if (res.ok)
      window.location.href = router.buildLocation({
        to: ROUTE_LOGIN,
      }).publicHref;
    return false;
  };

  const renderUserNav = () =>
    contextValue.authenticated &&
    contextValue.user && (
      <>
        <Link to={ROUTE_NOTIFICATIONS}>
          <Button variant="link" className="NotificationBadge">
            <Icon icon={notificationCount ? faBell : faBellOutlined} />
            {notificationCount && (
              <Badge bg={hasUrgent ? "danger" : "primary"} className="ms-1">
                {notificationCount}
              </Badge>
            )}
          </Button>
        </Link>
        <Link
          to="/users/$name"
          params={contextValue.user}
          className="nav-link ms-auto me-2"
          activeProps={{ className: "active", "aria-current": "page" }}
          activeOptions={{ exact: false, includeSearch: false }}
        >
          <Icon icon={faUser} className="me-2" />
          {contextValue.user.name}
        </Link>
        {isAdmin(user) && (
          <Link
            to={ROUTE_ADMIN}
            className="nav-link"
            activeProps={{ className: "active", "aria-current": "page" }}
            activeOptions={{ exact: false, includeSearch: false }}
          >
            Admin
          </Link>
        )}
        <a
          href={ROUTE_LOGOUT}
          onClick={(event) => {
            event.preventDefault();
            void handleLogout();
          }}
          className="nav-link me-4"
        >
          Logout
        </a>
      </>
    );

  return (
    <div>
      <Navbar bg="dark" variant="dark" className="px-4">
        <Nav className="me-auto">
          <Link
            to={ROUTE_HOME}
            className="nav-link"
            activeProps={{ className: "active", "aria-current": "page" }}
            activeOptions={{ exact: true, includeSearch: false }}
          >
            Home
          </Link>
          <Link
            to={ROUTE_PERFORMERS}
            className="nav-link"
            activeProps={{ className: "active", "aria-current": "page" }}
            activeOptions={{ exact: false, includeSearch: false }}
          >
            Performers
          </Link>
          <Link
            to={ROUTE_SCENES}
            className="nav-link"
            activeProps={{ className: "active", "aria-current": "page" }}
            activeOptions={{ exact: false, includeSearch: false }}
          >
            Scenes
          </Link>
          <Link
            to={ROUTE_STUDIOS}
            className="nav-link"
            activeProps={{ className: "active", "aria-current": "page" }}
            activeOptions={{ exact: false, includeSearch: false }}
          >
            Studios
          </Link>
          <Link
            to={ROUTE_TAGS}
            className="nav-link"
            activeProps={{ className: "active", "aria-current": "page" }}
            activeOptions={{ exact: false, includeSearch: false }}
          >
            Tags
          </Link>
          <Link
            to={ROUTE_EDITS}
            className="nav-link"
            activeProps={{ className: "active", "aria-current": "page" }}
            activeOptions={{ exact: false, includeSearch: false }}
          >
            Edits
          </Link>
          {canEdit(user) && (
            <Link
              to={ROUTE_DRAFTS}
              className="nav-link"
              activeProps={{ className: "active", "aria-current": "page" }}
              activeOptions={{ exact: false, includeSearch: false }}
            >
              Drafts
            </Link>
          )}
          <Link
            to={ROUTE_SITES}
            className="nav-link"
            activeProps={{ className: "active", "aria-current": "page" }}
            activeOptions={{ exact: false, includeSearch: false }}
          >
            Sites
          </Link>
          {canModerate(user) && (
            <Link
              to={ROUTE_IMAGE_REVIEW}
              className="nav-link"
              activeProps={{ className: "active", "aria-current": "page" }}
              activeOptions={{ exact: false, includeSearch: false }}
            >
              Image Review
            </Link>
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
