import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { useCurrentUser } from "src/hooks";
import { describe, expect, it, vi } from "vitest";
import Admin from "..";

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
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/admin/*" element={<Admin />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Admin", () => {
  it("blocks non-admin users from nested admin tools", () => {
    renderAdmin("/admin/users/add", false);
    expect(
      screen.getByText(/Administrator access is required/),
    ).toBeInTheDocument();
    expect(screen.queryByText("User management")).not.toBeInTheDocument();
  });

  it("provides links to every management section", () => {
    renderAdmin("/admin", true);
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

  it("renders image type settings inside admin", () => {
    renderAdmin("/admin/image-types", true);
    expect(screen.getByText("Image type settings")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Image Types" })).toHaveClass(
      "active",
    );
  });

  it("renders nested user tools with the admin navigation", () => {
    renderAdmin("/admin/users/add", true);
    expect(screen.getByText("User management")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Users" })).toHaveClass("active");
    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute(
      "href",
      "/admin",
    );
  });
});
