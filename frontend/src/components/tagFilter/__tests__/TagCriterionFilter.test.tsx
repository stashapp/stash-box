import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import TagCriterionFilter from "../TagCriterionFilter";

vi.mock("src/graphql", async (importOriginal) => ({
  ...(await importOriginal<typeof import("src/graphql")>()),
  useTag: ({ id }: { id: string }) => ({
    data: {
      findTag: { id, name: `tag-${id}`, description: null, aliases: [] },
    },
  }),
}));

vi.mock("../TagFilter", () => ({
  default: ({
    onChange,
    excludeTags,
  }: {
    onChange: (tag: { id: string }) => void;
    excludeTags: string[];
  }) => (
    <button
      type="button"
      data-excluded={excludeTags.join(",")}
      onClick={() => onChange({ id: "new" })}
    >
      add
    </button>
  ),
}));

const renderFilter = (
  props: Partial<React.ComponentProps<typeof TagCriterionFilter>> = {},
) => {
  const onTagsChange = vi.fn();
  const onModeChange = vi.fn();
  render(
    <MemoryRouter>
      <TagCriterionFilter
        tags={[]}
        mode="all"
        onTagsChange={onTagsChange}
        onModeChange={onModeChange}
        {...props}
      />
    </MemoryRouter>,
  );
  return { onTagsChange, onModeChange };
};

describe("TagCriterionFilter", () => {
  it("hides the mode selector until a tag is selected", () => {
    renderFilter();
    expect(screen.queryByLabelText("Tag filter mode")).toBeNull();
  });

  it("appends a newly picked tag and hides already selected ones", () => {
    const { onTagsChange } = renderFilter({ tags: ["a", "b"] });
    const add = screen.getByText("add");
    expect(add.dataset.excluded).toBe("a,b");
    fireEvent.click(add);
    expect(onTagsChange).toHaveBeenCalledWith(["a", "b", "new"]);
  });

  it("removes a selected tag", () => {
    const { onTagsChange } = renderFilter({ tags: ["a", "b"] });
    expect(screen.getByText("tag-a")).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: "" })[0]);
    expect(onTagsChange).toHaveBeenCalledWith(["b"]);
  });

  it("reports mode changes", () => {
    const { onModeChange } = renderFilter({ tags: ["a"] });
    fireEvent.change(screen.getByLabelText("Tag filter mode"), {
      target: { value: "exclude" },
    });
    expect(onModeChange).toHaveBeenCalledWith("exclude");
  });
});
