import { createRoute } from "@tanstack/react-router";
import { auditRoutes } from "src/pages/audits";
import { adminCategoryRoutes } from "src/pages/categories";
import ImageTypes from "src/pages/imageTypes";
import { adminSiteCategoryRoutes } from "src/pages/siteCategories";
import { adminSiteRoutes } from "src/pages/sites";
import { adminUserRoutes } from "src/pages/users";
import { adminRoute } from "src/routing/layouts";
import Admin, { AdminOverview } from "./Admin";

export { AdminOverview };
export default Admin;

const adminOverviewRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/",
  component: AdminOverview,
});

const imageTypesRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "image-types",
  component: ImageTypes,
});

export const adminRoutes = adminRoute.addChildren([
  adminOverviewRoute,
  imageTypesRoute,
  adminCategoryRoutes,
  adminSiteRoutes,
  adminSiteCategoryRoutes,
  adminUserRoutes,
  auditRoutes,
]);
