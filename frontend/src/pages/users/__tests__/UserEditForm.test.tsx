import { screen, waitFor } from "@testing-library/react";
import { ConfigDocument, RoleEnum } from "src/graphql";
import { renderForm } from "src/test/renderForm";
import { selectReactSelect } from "src/test/selectors";
import { describe, expect, it, vi } from "vitest";
import UserEditForm from "../UserEditForm";

const adminAuth = {
  authenticated: true,
  user: { id: "admin", name: "admin", roles: [RoleEnum.ADMIN] },
};

const nonAdminAuth = {
  authenticated: true,
  user: { id: "viewer", name: "viewer", roles: [RoleEnum.READ] },
};

const configMock = {
  request: { query: ConfigDocument },
  result: {
    data: {
      getConfig: {
        edit_update_limit: 0,
        host_url: "",
        require_invite: false,
        require_activation: false,
        vote_promotion_threshold: 0,
        vote_application_threshold: 0,
        voting_period: 0,
        min_destructive_voting_period: 0,
        vote_cron_interval: "",
        guidelines_url: "",
        require_scene_draft: false,
        require_tag_role: false,
      },
    },
  },
};

const baseUser = {
  id: "u-1",
  name: "alice",
  email: "alice@example.com",
  password: null,
  roles: [RoleEnum.READ, RoleEnum.EDIT],
};

describe("UserEditForm", () => {
  describe("as admin", () => {
    it("submits with updated email and roles", async () => {
      const callback = vi.fn();
      const { user } = renderForm(
        <UserEditForm user={baseUser} username="alice" callback={callback} />,
        { auth: adminAuth, mocks: [configMock, configMock] },
      );
      const email = screen.getByPlaceholderText("Email");
      await user.clear(email);
      await user.type(email, "new@example.com");
      await selectReactSelect(user, RoleEnum.VOTE);
      await user.click(screen.getByRole("button", { name: "Save" }));
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      const [arg] = callback.mock.calls[0];
      expect(arg).toMatchObject({
        id: "u-1",
        email: "new@example.com",
      });
      expect((arg as { roles: string[] }).roles.sort()).toEqual(
        [RoleEnum.READ, RoleEnum.EDIT, RoleEnum.VOTE].sort(),
      );
    });

    it("changes username", async () => {
      const callback = vi.fn();
      const { user } = renderForm(
        <UserEditForm user={baseUser} username="alice" callback={callback} />,
        { auth: adminAuth, mocks: [configMock, configMock] },
      );
      const name = screen.getByPlaceholderText("Username");
      await user.clear(name);
      await user.type(name, "renamed");
      await user.click(screen.getByRole("button", { name: "Save" }));
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ name: "renamed" }),
      );
    });
  });

  describe("as non-admin", () => {
    it("hides username and roles fields", () => {
      renderForm(
        <UserEditForm user={baseUser} username="alice" callback={vi.fn()} />,
        { auth: nonAdminAuth, mocks: [configMock, configMock] },
      );
      expect(screen.queryByPlaceholderText("Username")).not.toBeInTheDocument();
      expect(screen.queryByText("Roles")).not.toBeInTheDocument();
    });

    it("renders only the email field for non-admin users", () => {
      renderForm(
        <UserEditForm user={baseUser} username="alice" callback={vi.fn()} />,
        { auth: nonAdminAuth, mocks: [configMock, configMock] },
      );
      expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
      expect(screen.queryByPlaceholderText("Username")).not.toBeInTheDocument();
    });
  });

  describe("validation", () => {
    it("requires valid email", async () => {
      const callback = vi.fn();
      const { user } = renderForm(
        <UserEditForm user={baseUser} username="alice" callback={callback} />,
        { auth: adminAuth, mocks: [configMock, configMock] },
      );
      const email = screen.getByPlaceholderText("Email");
      await user.clear(email);
      await user.type(email, "not-an-email");
      await user.click(screen.getByRole("button", { name: "Save" }));
      await waitFor(() => expect(callback).not.toHaveBeenCalled(), {
        timeout: 200,
      });
      expect(callback).not.toHaveBeenCalled();
    });
  });
});
