import { Link, Outlet } from "@tanstack/react-router";
import type { FC } from "react";
import { Nav } from "react-bootstrap";
import { ErrorMessage } from "src/components/fragments";
import Title from "src/components/title";
import { ROUTE_ADMIN } from "src/constants/route";
import { useCurrentUser } from "src/hooks";

const sections = [
  {
    to: "/admin/image-types",
    title: "Image Types",
    description: "Manage image label ordering and enabled types.",
  },
  {
    to: "/admin/users",
    title: "Users",
    description: "Create users and manage accounts and roles.",
  },
  {
    to: "/admin/audits",
    title: "Audits",
    description: "Review moderation activity.",
  },
  {
    to: "/admin/categories",
    title: "Tag categories",
    description: "Create and edit tag categories.",
  },
  { to: "/admin/sites", title: "Sites", description: "Create and edit sites." },
  {
    to: "/admin/site-categories",
    title: "Site categories",
    description: "Create and edit site categories.",
  },
] as const;

const Admin: FC = () => {
  const { isAdmin } = useCurrentUser();
  if (!isAdmin)
    return (
      <ErrorMessage error="Access denied. Administrator access is required." />
    );

  return (
    <>
      <Title page="Admin" />
      <h2>Admin</h2>
      <Nav variant="tabs" className="mb-4">
        <Nav.Item>
          <Link
            to={ROUTE_ADMIN}
            className="nav-link"
            activeProps={{ className: "active", "aria-current": "page" }}
            activeOptions={{ exact: true, includeSearch: false }}
          >
            Overview
          </Link>
        </Nav.Item>
        {sections.map(({ to, title }) => (
          <Nav.Item key={to}>
            <Link
              to={to}
              className="nav-link"
              activeProps={{ className: "active", "aria-current": "page" }}
              activeOptions={{ exact: false, includeSearch: false }}
            >
              {title}
            </Link>
          </Nav.Item>
        ))}
      </Nav>
      <Outlet />
    </>
  );
};

export default Admin;

export const AdminOverview = () => (
  <div className="row g-3">
    {sections.map(({ to, title, description }) => (
      <div className="col-md-6" key={to}>
        <div className="card h-100">
          <div className="card-body">
            <h3 className="h5">
              <Link to={to}>{title}</Link>
            </h3>
            <p className="mb-0">{description}</p>
          </div>
        </div>
      </div>
    ))}
  </div>
);
