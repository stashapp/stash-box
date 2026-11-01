import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { useCurrentUser } from "src/hooks";
import { describe, expect, it, vi } from "vitest";
import Admin, { AdminOverview } from "..";

vi.mock("src/hooks", () => ({ useCurrentUser: vi.fn() }));
vi.mock("src/components/title", () => ({ default: () => null }));
vi.mock("src/pages/users", () => ({
  default: () => <div>User management</div>,
}));
vi.mock("src/pages/audits", () => ({ default: () => <div>Audit log</div> }));
vi.mock("src/pages/imageTypes", () => ({
  default: () => <div>Image type settings</div>,
}));
vi.mock("src/pages/categories", () => ({ default: () => null }));
vi.mock("src/pages/sites", () => ({ default: () => null }));
vi.mock("src/pages/siteCategories", () => ({ default: () => null }));

function renderAdmin(path: string, isAdmin: boolean) {
  vi.mocked(useCurrentUser).mockReturnValue({ isAdmin } as ReturnType<
    typeof useCurrentUser
  >);
  const root = createRootRoute();
  const admin = createRoute({
    getParentRoute: () => root,
    path: "/admin",
    component: Admin,
  });
  const overview = createRoute({
    getParentRoute: () => admin,
    path: "/",
    component: AdminOverview,
  });
  const images = createRoute({
    getParentRoute: () => admin,
    path: "image-types",
    component: () => <div>Image type settings</div>,
  });
  const users = createRoute({
    getParentRoute: () => admin,
    path: "users/$",
    component: () => <div>User management</div>,
  });
  const router = createRouter({
    routeTree: root.addChildren([admin.addChildren([overview, images, users])]),
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  return render(<RouterProvider router={router} />);
}

describe("Admin", () => {
  it("blocks non-admin users from nested admin tools", async () => {
    renderAdmin("/admin/users/add", false);
    await screen.findByText(/Administrator access is required/);
    expect(
      screen.getByText(/Administrator access is required/),
    ).toBeInTheDocument();
    expect(screen.queryByText("User management")).not.toBeInTheDocument();
  });

  it("provides links to every management section", async () => {
    renderAdmin("/admin", true);
    await screen.findByRole("heading", { name: "Admin" });
    for (const path of [
      "image-types",
      "users",
      "audits",
      "categories",
      "sites",
      "site-categories",
    ]) {
      expect(
        document.querySelector(`.card a[href="/admin/${path}"]`),
      ).toBeInTheDocument();
    }
  });

  it("renders image type settings inside admin", async () => {
    renderAdmin("/admin/image-types", true);
    await screen.findByText("Image type settings");
    expect(screen.getByText("Image type settings")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Image Types" })).toHaveClass(
      "active",
    );
  });

  it("renders nested user tools with the admin navigation", async () => {
    renderAdmin("/admin/users/add", true);
    await screen.findByText("User management");
    expect(screen.getByText("User management")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Users" })).toHaveClass("active");
    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute(
      "href",
      "/admin",
    );
  });
});
