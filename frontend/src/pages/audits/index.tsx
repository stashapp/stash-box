import { createRoute } from "@tanstack/react-router";
import { adminRoute } from "src/routing/layouts";
import Audits from "./Audits";

export const AuditListPage = () => <Audits />;

export default AuditListPage;

const auditsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "audits",
});

const auditsListRoute = createRoute({
  getParentRoute: () => auditsRoute,
  path: "/",
  component: AuditListPage,
});

export const auditRoutes = auditsRoute.addChildren([auditsListRoute]);
