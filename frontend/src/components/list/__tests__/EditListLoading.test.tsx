import { screen, waitFor } from "@testing-library/react";
import { makeEmptyEditsResult } from "lib/test/fixtures/lists";
import { renderForm } from "lib/test/render";
import { EditSortEnum, EditsDocument } from "src/graphql";
import { afterEach, describe, expect, it, vi } from "vitest";
import EditList from "../EditList";

afterEach(() => vi.restoreAllMocks());

describe("independent edit panels", () => {
  it("keeps the page header visible while the panel shows its skeleton", async () => {
    renderForm(
      <>
        <h1>Performer details</h1>
        <EditList />
      </>,
      {
        mocks: [
          {
            request: { query: EditsDocument, variables: () => true },
            result: {
              data: {
                queryEdits: {
                  __typename: "QueryEditsResultType",
                  count: 0,
                  edits: [],
                },
              },
            },
            delay: 100,
          },
        ],
      },
    );
    expect(
      screen.getByRole("heading", { name: "Performer details" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: "Loading edits" }),
    ).toBeInTheDocument();
    expect(await screen.findByText("No results")).toBeInTheDocument();
    expect(
      screen.queryByRole("status", { name: "Loading edits" }),
    ).not.toBeInTheDocument();
  });

  it("keeps revealed results visible while a filter transition loads", async () => {
    const updatedResult = vi.fn(() => ({
      data: {
        queryEdits: { __typename: "QueryEditsResultType", count: 0, edits: [] },
      },
    }));
    const { user } = renderForm(
      <>
        <h1>Performer details</h1>
        <EditList />
      </>,
      {
        route: "/edits",
        routePath: "/edits",
        mocks: [
          {
            request: { query: EditsDocument, variables: () => true },
            result: {
              data: {
                queryEdits: {
                  __typename: "QueryEditsResultType",
                  count: 0,
                  edits: [],
                },
              },
            },
          },
          {
            request: { query: EditsDocument, variables: () => true },
            result: updatedResult,
            delay: 300,
          },
        ],
      },
    );
    await screen.findByText("No results");
    await user.selectOptions(
      screen.getAllByRole("combobox")[0],
      EditSortEnum.CLOSED_AT,
    );
    expect(updatedResult).not.toHaveBeenCalled();
    expect(screen.queryByText("Updating results…")).not.toBeInTheDocument();
    for (const spinner of screen.getAllByRole("status", {
      name: "Updating results",
    })) {
      expect(spinner).toBeVisible();
    }
    expect(screen.getByText("No results")).toBeVisible();
    expect(
      screen.queryByRole("status", { name: "Loading edits" }),
    ).not.toBeInTheDocument();
    await waitFor(() => expect(updatedResult).toHaveBeenCalledTimes(1));
  });

  it("identifies previous results after a filter fails and can retry", async () => {
    const { user } = renderForm(<EditList />, {
      route: "/edits",
      routePath: "/edits",
      mocks: [
        {
          request: { query: EditsDocument, variables: () => true },
          result: { data: makeEmptyEditsResult() },
        },
        {
          request: { query: EditsDocument, variables: () => true },
          error: new Error("Filter request failed"),
        },
        {
          request: { query: EditsDocument, variables: () => true },
          result: { data: makeEmptyEditsResult() },
        },
      ],
    });
    await screen.findByText("No results");
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Edit order" }),
      EditSortEnum.CLOSED_AT,
    );
    expect(
      await screen.findByText(/Showing previous results/),
    ).toBeInTheDocument();
    expect(screen.getByText("No results")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() =>
      expect(
        screen.queryByText(/Filter request failed/),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByText("No results")).toBeVisible();
  });

  it("keeps query errors local and retries only the failed panel", async () => {
    const { user } = renderForm(
      <>
        <h1>Performer details</h1>
        <EditList />
      </>,
      {
        mocks: [
          {
            request: { query: EditsDocument, variables: () => true },
            error: new Error("Edit history unavailable"),
          },
          {
            request: { query: EditsDocument, variables: () => true },
            result: {
              data: {
                queryEdits: {
                  __typename: "QueryEditsResultType",
                  count: 0,
                  edits: [],
                },
              },
            },
          },
        ],
      },
    );
    await screen.findByText(/Edit history unavailable/);
    expect(
      screen.getByRole("heading", { name: "Performer details" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("No results")).toBeInTheDocument();
  });
});
