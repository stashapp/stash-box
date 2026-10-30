import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PerformerSearch from "../PerformerSearch";

const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("src/graphql", async (importOriginal) => ({
  ...(await importOriginal<typeof import("src/graphql")>()),
  usePerformers: query,
  usePerformer: () => ({}),
  useStudio: () => ({}),
}));
vi.mock("src/components/searchField", () => ({
  default: () => null,
  SearchType: { Performer: "performer" },
}));
vi.mock("src/components/studioSelect", () => ({ default: () => null }));
vi.mock("src/components/list", () => ({ List: () => null }));

const showSearch = (search = "") =>
  render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      initialEntries={[`/performers/search${search}`]}
    >
      <PerformerSearch />
    </MemoryRouter>,
  );

describe("performer search validation", () => {
  beforeEach(() => {
    query.mockReset();
    query.mockReturnValue({
      loading: false,
      data: { queryPerformers: { count: 0, performers: [] } },
    });
  });

  it("does not query invalid numeric URL filters and keeps them editable", async () => {
    await act(async () => {
      showSearch("?height=123e12");
    });
    expect(query).toHaveBeenLastCalledWith(expect.anything(), true);
    expect(query.mock.lastCall?.[0].input.height).toBeUndefined();
    expect(screen.getByLabelText("height")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    fireEvent.change(screen.getByLabelText("height"), {
      target: { value: "123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Search$/ }));
    expect(query).toHaveBeenLastCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          height: { value: 123, modifier: "EQUALS" },
        }),
      }),
      false,
    );
  });

  it("blocks invalid numeric submissions", async () => {
    await act(async () => {
      showSearch();
    });
    fireEvent.change(screen.getByLabelText("height"), {
      target: { value: "123e12" },
    });
    const form = screen
      .getByRole("button", { name: /^Search$/ })
      .closest("form");
    if (!form) throw new Error("Search form missing");
    fireEvent.submit(form);
    expect(query.mock.lastCall?.[0].input.height).toBeUndefined();
    expect(
      screen.getByText("Enter a whole number between 0 and 2147483647."),
    ).toBeInTheDocument();
  });

  it.each([
    "birthdate",
    "deathdate",
  ])("blocks invalid %s URL filters", async (field) => {
    await act(async () => {
      showSearch(`?${field}=20081231231`);
    });
    expect(query).toHaveBeenLastCalledWith(expect.anything(), true);
    expect(query.mock.lastCall?.[0].input[field]).toBeUndefined();
    expect(
      screen.getByText("Enter a date as YYYY, YYYY-MM, or YYYY-MM-DD."),
    ).toBeInTheDocument();
    fireEvent.change(
      screen.getByLabelText(field === "birthdate" ? "Birthdate" : "Deathdate"),
      { target: { value: "2008" } },
    );
    fireEvent.click(screen.getByRole("button", { name: /^Search$/ }));
    expect(query.mock.lastCall?.[0].input[field]).toEqual({
      value: "2008",
      modifier: "EQUALS",
    });
    expect(query.mock.lastCall?.[1]).toBe(false);
  });

  it("keeps the form available after a failed query", async () => {
    query.mockReturnValue({ loading: false, error: new Error("Query failed") });
    await act(async () => {
      showSearch();
    });
    expect(screen.getByLabelText("height")).toBeInTheDocument();
    expect(screen.getByText(/Failed to load performers/)).toBeInTheDocument();
  });
});
