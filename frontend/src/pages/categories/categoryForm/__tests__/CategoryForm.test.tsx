import { screen, waitFor } from "@testing-library/react";
import { TagGroupEnum } from "src/graphql/types";
import { renderForm } from "src/test/renderForm";
import { describe, expect, it, vi } from "vitest";
import CategoryForm from "../CategoryForm";

const baseCategory = {
  __typename: "TagCategory" as const,
  id: "cat-1",
  name: "Activity",
  description: "Things people do",
  group: TagGroupEnum.ACTION,
};

const setup = (props: Partial<Parameters<typeof CategoryForm>[0]> = {}) => {
  const callback = vi.fn();
  const utils = renderForm(<CategoryForm callback={callback} {...props} />);
  return { callback, ...utils };
};

describe("CategoryForm", () => {
  describe("create", () => {
    it("submits with all fields filled", async () => {
      const { callback, user } = setup();
      await user.type(screen.getByPlaceholderText("Name"), "Animals");
      await user.type(
        screen.getByPlaceholderText("Description"),
        "Animal-related tags",
      );
      await user.selectOptions(
        screen.getByRole("combobox"),
        TagGroupEnum.PEOPLE,
      );
      await user.click(screen.getByRole("button", { name: "Save" }));

      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(callback).toHaveBeenCalledWith({
        name: "Animals",
        description: "Animal-related tags",
        group: TagGroupEnum.PEOPLE,
      });
    });

    it("submits with default group when not changed", async () => {
      const { callback, user } = setup();
      await user.type(screen.getByPlaceholderText("Name"), "X");
      await user.click(screen.getByRole("button", { name: "Save" }));

      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ group: TagGroupEnum.ACTION, name: "X" }),
      );
    });
  });

  describe("edit", () => {
    it("changes name", async () => {
      const { callback, user } = setup({ category: baseCategory });
      const nameInput = screen.getByPlaceholderText("Name");
      await user.clear(nameInput);
      await user.type(nameInput, "Renamed");
      await user.click(screen.getByRole("button", { name: "Save" }));

      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Renamed" }),
      );
    });

    it("changes description", async () => {
      const { callback, user } = setup({ category: baseCategory });
      const desc = screen.getByPlaceholderText("Description");
      await user.clear(desc);
      await user.type(desc, "Updated desc");
      await user.click(screen.getByRole("button", { name: "Save" }));

      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ description: "Updated desc" }),
      );
    });

    it("changes group", async () => {
      const { callback, user } = setup({ category: baseCategory });
      await user.selectOptions(
        screen.getByRole("combobox"),
        TagGroupEnum.SCENE,
      );
      await user.click(screen.getByRole("button", { name: "Save" }));

      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ group: TagGroupEnum.SCENE }),
      );
    });
  });

  describe("validation", () => {
    it("blocks submission when name is empty", async () => {
      const { callback, user } = setup();
      await user.click(screen.getByRole("button", { name: "Save" }));

      expect(await screen.findByText("Name is required")).toBeInTheDocument();
      expect(callback).not.toHaveBeenCalled();
    });
  });
});
