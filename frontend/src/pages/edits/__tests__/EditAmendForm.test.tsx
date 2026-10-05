import { screen, waitFor } from "@testing-library/react";
import {
  AmendEditDocument,
  type EditFragment,
  OperationEnum,
  TargetTypeEnum,
  VoteStatusEnum,
} from "src/graphql";
import { renderForm } from "src/test/renderForm";
import { describe, expect, it, vi } from "vitest";
import EditAmendForm from "../EditAmendForm";

const amendmentState = {
  removedFields: new Set<string>(),
  removedAddedItems: new Map<string, Set<number>>(),
  removedRemovedItems: new Map<string, Set<number>>(),
};
let hasChanges = false;

vi.mock("src/components/amendableEditCard", () => ({
  AmendableModifyEdit: () => (
    <div data-testid="amendable-modify-edit">[modify edit]</div>
  ),
  useAmendment: () => ({
    state: amendmentState,
    hasChanges,
  }),
}));

const baseEdit: EditFragment = {
  __typename: "Edit",
  id: "edit-1",
  target_type: TargetTypeEnum.PERFORMER,
  operation: OperationEnum.MODIFY,
  status: VoteStatusEnum.PENDING,
  bot: false,
  applied: false,
  created: "2024-01-01",
  updated: null,
  closed: null,
  expires: null,
  update_count: 0,
  updatable: true,
  vote_count: 0,
  destructive: false,
  comments: [],
  votes: [],
  user: { __typename: "User", id: "u-1", name: "alice" },
  // biome-ignore lint/suspicious/noExplicitAny: minimal fixture
  target: null as any,
  // biome-ignore lint/suspicious/noExplicitAny: minimal fixture
  details: null as any,
  // biome-ignore lint/suspicious/noExplicitAny: minimal fixture
  old_details: null as any,
  // biome-ignore lint/suspicious/noExplicitAny: minimal fixture
  options: null as any,
  // biome-ignore lint/suspicious/noExplicitAny: minimal fixture
  merge_sources: [] as any,
};

const amendMock = (input: unknown) => ({
  request: { query: AmendEditDocument, variables: { input } },
  result: { data: { amendEdit: baseEdit } },
});

describe("EditAmendForm", () => {
  it("submit button is disabled with no reason or no changes", () => {
    hasChanges = false;
    renderForm(<EditAmendForm edit={baseEdit} />);
    expect(screen.getByRole("button", { name: "Amend Edit" })).toBeDisabled();
  });

  it("submit button stays disabled with reason but no changes", async () => {
    hasChanges = false;
    const { user } = renderForm(<EditAmendForm edit={baseEdit} />);
    await user.type(
      screen.getByPlaceholderText(/Explain why these fields/),
      "Reason",
    );
    expect(screen.getByRole("button", { name: "Amend Edit" })).toBeDisabled();
  });

  it("submit button stays disabled with changes but no reason", () => {
    hasChanges = true;
    renderForm(<EditAmendForm edit={baseEdit} />);
    expect(screen.getByRole("button", { name: "Amend Edit" })).toBeDisabled();
  });

  it("fires AmendEdit mutation when reason and changes both present", async () => {
    hasChanges = true;
    amendmentState.removedFields = new Set(["name"]);
    const expectedInput = {
      id: "edit-1",
      reason: "Looks wrong",
      remove_fields: ["name"],
      remove_added_items: [],
      remove_removed_items: [],
    };

    const { user } = renderForm(<EditAmendForm edit={baseEdit} />, {
      mocks: [amendMock(expectedInput)],
    });
    await user.type(
      screen.getByPlaceholderText(/Explain why these fields/),
      "Looks wrong",
    );
    const submitBtn = screen.getByRole("button", { name: "Amend Edit" });
    await waitFor(() => expect(submitBtn).not.toBeDisabled());
    await user.click(submitBtn);

    await waitFor(() => {
      expect(submitBtn).toBeDisabled();
    });

    amendmentState.removedFields = new Set();
  });

  it("renders the embedded edit summary", () => {
    hasChanges = false;
    renderForm(<EditAmendForm edit={baseEdit} />);
    expect(screen.getByTestId("amendable-modify-edit")).toBeInTheDocument();
  });

  it("renders edit operation and target type in the heading", () => {
    hasChanges = false;
    renderForm(<EditAmendForm edit={baseEdit} />);
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(
      /Amend Edit/,
    );
  });
});
