import { screen, waitFor } from "@testing-library/react";
import { RoleEnum, type UserUpdateInput } from "src/graphql/types";
import { renderForm } from "src/test/renderForm";
import { selectReactSelect } from "src/test/selectors";
import { describe, expect, it, vi } from "vitest";
import UserForm from "../UserForm";

const blankUser = {
  name: "",
  email: "",
  password: "",
  roles: [],
} as unknown as UserUpdateInput;

const fullUser = {
  id: "u-1",
  name: "alice",
  email: "alice@example.com",
  password: "OldPassword!1",
  roles: [RoleEnum.READ, RoleEnum.EDIT],
} as unknown as UserUpdateInput;

const fillBasics = async (
  user: ReturnType<typeof renderForm>["user"],
  values: { name: string; email: string; password: string },
) => {
  await user.type(screen.getByPlaceholderText("Username"), values.name);
  await user.type(screen.getByPlaceholderText("Email"), values.email);
  await user.type(screen.getByPlaceholderText("Password"), values.password);
};

describe("UserForm (create)", () => {
  it("submits with all fields filled and roles selected", async () => {
    const callback = vi.fn();
    const { user } = renderForm(
      <UserForm user={blankUser} callback={callback} />,
    );

    await fillBasics(user, {
      name: "bob",
      email: "bob@example.com",
      password: "Secret!12",
    });
    await selectReactSelect(user, RoleEnum.READ);
    await selectReactSelect(user, RoleEnum.VOTE);
    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "bob",
        email: "bob@example.com",
        password: "Secret!12",
        roles: [RoleEnum.READ, RoleEnum.VOTE],
      }),
      undefined,
    );
  });

  it("renders server-side error", () => {
    renderForm(
      <UserForm user={blankUser} callback={vi.fn()} error="Server failure" />,
    );
    expect(screen.getByText("Server failure")).toBeInTheDocument();
  });
});

describe("UserForm (edit / validation)", () => {
  it("changes username", async () => {
    const callback = vi.fn();
    const { user } = renderForm(
      <UserForm user={fullUser} callback={callback} />,
    );
    const name = screen.getByPlaceholderText("Username");
    await user.clear(name);
    await user.type(name, "renamed");
    await user.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({ name: "renamed" }),
      undefined,
    );
  });

  it("changes email", async () => {
    const callback = vi.fn();
    const { user } = renderForm(
      <UserForm user={fullUser} callback={callback} />,
    );
    const email = screen.getByPlaceholderText("Email");
    await user.clear(email);
    await user.type(email, "new@example.com");
    await user.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({ email: "new@example.com" }),
      undefined,
    );
  });

  it("requires username", async () => {
    const callback = vi.fn();
    const { user } = renderForm(
      <UserForm user={blankUser} callback={callback} />,
    );
    await user.type(screen.getByPlaceholderText("Email"), "bob@example.com");
    await user.type(screen.getByPlaceholderText("Password"), "Secret!12");
    await user.click(screen.getByRole("button", { name: "Create" }));
    expect(await screen.findByText("Username is required")).toBeInTheDocument();
    expect(callback).not.toHaveBeenCalled();
  });

  it("requires email", async () => {
    const callback = vi.fn();
    const { user } = renderForm(
      <UserForm user={blankUser} callback={callback} />,
    );
    await user.type(screen.getByPlaceholderText("Username"), "bob");
    await user.type(screen.getByPlaceholderText("Password"), "Secret!12");
    await user.click(screen.getByRole("button", { name: "Create" }));
    expect(await screen.findByText("Email is required")).toBeInTheDocument();
    expect(callback).not.toHaveBeenCalled();
  });

  it("requires password and validates min length", async () => {
    const callback = vi.fn();
    const { user } = renderForm(
      <UserForm user={blankUser} callback={callback} />,
    );
    await user.type(screen.getByPlaceholderText("Username"), "bob");
    await user.type(screen.getByPlaceholderText("Email"), "bob@example.com");
    await user.type(screen.getByPlaceholderText("Password"), "short");
    await user.click(screen.getByRole("button", { name: "Create" }));
    expect(
      await screen.findByText("Password must be at least 8 characters"),
    ).toBeInTheDocument();
    expect(callback).not.toHaveBeenCalled();
  });

  it("validates unique-char count on password", async () => {
    const callback = vi.fn();
    const { user } = renderForm(
      <UserForm user={blankUser} callback={callback} />,
    );
    await user.type(screen.getByPlaceholderText("Username"), "bob");
    await user.type(screen.getByPlaceholderText("Email"), "bob@example.com");
    await user.type(screen.getByPlaceholderText("Password"), "aaaaaaaa");
    await user.click(screen.getByRole("button", { name: "Create" }));
    expect(
      await screen.findByText(
        "Password must have at least 5 unique characters",
      ),
    ).toBeInTheDocument();
    expect(callback).not.toHaveBeenCalled();
  });
});
