import { createRoute } from "@tanstack/react-router";
import { narrowRoute } from "src/routing/layouts";
import { validateEditSearch } from "src/routing/searchValidators";
import Edit from "./Edit";
import EditAmend from "./EditAmend";
import Edits from "./Edits";
import EditUpdate from "./EditUpdate";

export const EditListPage = () => <Edits />;

export const EditUpdatePage = () => <EditUpdate />;

export const EditAmendPage = () => <EditAmend />;

export const EditDetailPage = () => <Edit />;

export default EditListPage;

const editsRoute = createRoute({
  getParentRoute: () => narrowRoute,
  path: "edits",
});

const editsListRoute = createRoute({
  getParentRoute: () => editsRoute,
  path: "/",
  validateSearch: validateEditSearch,
  component: EditListPage,
});

const editsUpdateRoute = createRoute({
  getParentRoute: () => editsRoute,
  path: "$id/update",
  component: EditUpdatePage,
});

const editsAmendRoute = createRoute({
  getParentRoute: () => editsRoute,
  path: "$id/amend",
  component: EditAmendPage,
});

const editsDetailRoute = createRoute({
  getParentRoute: () => editsRoute,
  path: "$id",
  component: EditDetailPage,
});

export const editRoutes = editsRoute.addChildren([
  editsListRoute,
  editsUpdateRoute,
  editsAmendRoute,
  editsDetailRoute,
]);
