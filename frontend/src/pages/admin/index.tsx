import type { FC } from "react";
import { Nav } from "react-bootstrap";
import { Link, NavLink, Route, Routes } from "react-router-dom";
import { ErrorMessage } from "src/components/fragments";
import Title from "src/components/title";
import { ROUTE_ADMIN } from "src/constants/route";
import { useCurrentUser } from "src/hooks";
import Audits from "src/pages/audits";
import Categories from "src/pages/categories";
import SiteCategories from "src/pages/siteCategories";
import Sites from "src/pages/sites";
import Users from "src/pages/users";

const sections = [
  {
    path: "users",
    title: "Users",
    description: "Create users and manage accounts and roles.",
  },
  {
    path: "audits",
    title: "Audits",
    description: "Review moderation activity.",
  },
  {
    path: "categories",
    title: "Tag categories",
    description: "Create and edit tag categories.",
  },
  { path: "sites", title: "Sites", description: "Create and edit sites." },
  {
    path: "site-categories",
    title: "Site categories",
    description: "Create and edit site categories.",
  },
];

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
          <NavLink to={ROUTE_ADMIN} end className="nav-link">
            Overview
          </NavLink>
        </Nav.Item>
        {sections.map(({ path, title }) => (
          <Nav.Item key={path}>
            <NavLink to={`${ROUTE_ADMIN}/${path}`} className="nav-link">
              {title}
            </NavLink>
          </Nav.Item>
        ))}
      </Nav>
      <Routes>
        <Route
          index
          element={
            <div className="row g-3">
              {sections.map(({ path, title, description }) => (
                <div className="col-md-6" key={path}>
                  <div className="card h-100">
                    <div className="card-body">
                      <h3 className="h5">
                        <Link to={`${ROUTE_ADMIN}/${path}`}>{title}</Link>
                      </h3>
                      <p className="mb-0">{description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          }
        />
        <Route path="users/*" element={<Users />} />
        <Route path="audits/*" element={<Audits />} />
        <Route path="categories/*" element={<Categories />} />
        <Route path="sites/*" element={<Sites />} />
        <Route path="site-categories/*" element={<SiteCategories />} />
        <Route
          path="*"
          element={<ErrorMessage error="Admin page not found." />}
        />
      </Routes>
    </>
  );
};

export default Admin;
