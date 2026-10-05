import { screen, waitFor } from "@testing-library/react";
import { renderForm } from "src/test/renderForm";
import { describe, expect, it, vi } from "vitest";
import UserPasswordForm from "../UserPasswordForm";

const setup = () => {
  const callback = vi.fn();
  const utils = renderForm(<UserPasswordForm callback={callback} />);
  return { callback, ...utils };
};

describe("UserPasswordForm", () => {
  it("submits with valid passwords", async () => {
    const { callback, user } = setup();

    await user.type(
      screen.getByPlaceholderText("Existing Password"),
      "OldPass!1",
    );
    await user.type(screen.getByPlaceholderText("New Password"), "NewPass!1");
    await user.type(
      screen.getByPlaceholderText("Confirm New Password"),
      "NewPass!1",
    );
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
    expect(callback).toHaveBeenCalledWith({
      existingPassword: "OldPass!1",
      newPassword: "NewPass!1",
    });
  });

  it("shows error when existing password is empty", async () => {
    const { callback, user } = setup();
    await user.type(screen.getByPlaceholderText("New Password"), "NewPass!1");
    await user.type(
      screen.getByPlaceholderText("Confirm New Password"),
      "NewPass!1",
    );
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText("Existing password is required"),
    ).toBeInTheDocument();
    expect(callback).not.toHaveBeenCalled();
  });

  it("shows error when new password is too short", async () => {
    const { callback, user } = setup();
    await user.type(
      screen.getByPlaceholderText("Existing Password"),
      "OldPass!1",
    );
    await user.type(screen.getByPlaceholderText("New Password"), "short");
    await user.type(
      screen.getByPlaceholderText("Confirm New Password"),
      "short",
    );
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText("Password must be at least 8 characters"),
    ).toBeInTheDocument();
    expect(callback).not.toHaveBeenCalled();
  });

  it("shows error when new password has fewer than 5 unique chars", async () => {
    const { callback, user } = setup();
    await user.type(
      screen.getByPlaceholderText("Existing Password"),
      "OldPass!1",
    );
    await user.type(screen.getByPlaceholderText("New Password"), "aaaaaaaa");
    await user.type(
      screen.getByPlaceholderText("Confirm New Password"),
      "aaaaaaaa",
    );
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText(
        "Password must have at least 5 unique characters",
      ),
    ).toBeInTheDocument();
    expect(callback).not.toHaveBeenCalled();
  });

  it("shows error when passwords do not match", async () => {
    const { callback, user } = setup();
    await user.type(
      screen.getByPlaceholderText("Existing Password"),
      "OldPass!1",
    );
    await user.type(screen.getByPlaceholderText("New Password"), "NewPass!1");
    await user.type(
      screen.getByPlaceholderText("Confirm New Password"),
      "Different1",
    );
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText("Passwords don't match"),
    ).toBeInTheDocument();
    expect(callback).not.toHaveBeenCalled();
  });

  it("renders external error", () => {
    renderForm(<UserPasswordForm callback={vi.fn()} error="Bad server" />);
    expect(screen.getByText("Bad server")).toBeInTheDocument();
  });
});
