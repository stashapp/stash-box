import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ImageCategorization, {
  type CategorizationEditor,
} from "../ImageCategorization";

const state = vi.hoisted(() => ({
  editor: true,
  image: { id: "1", types: [], date: null, organized: false },
  update: vi.fn(),
  organize: vi.fn(),
}));
vi.mock("src/hooks", () => ({
  useCurrentUser: () => ({ isEditor: state.editor, isModerator: true }),
}));
vi.mock("src/graphql", async (importOriginal) => ({
  ...(await importOriginal<typeof import("src/graphql")>()),
  ImageTypeScopeEnum: { PERFORMER: "PERFORMER" },
  useImageCategorization: () => ({ data: { findImage: state.image } }),
  useImageTypeGroups: () => ({}),
  useUpdateImage: () => [state.update, { loading: false }],
  useSetImageOrganized: () => [state.organize, { loading: false }],
}));
vi.mock("src/components/editImages/ImageLabels", () => ({
  default: ({
    onChange,
    labelsDisabled,
  }: {
    onChange: (value: unknown) => void;
    labelsDisabled: boolean;
  }) => (
    <button
      type="button"
      disabled={labelsDisabled}
      onClick={() => onChange({ types: [], date: "2020-01-01" })}
    >
      Change labels
    </button>
  ),
}));

describe("ImageCategorization", () => {
  beforeEach(() => {
    state.editor = true;
    state.update.mockReset().mockResolvedValue({});
    state.organize.mockReset().mockResolvedValue({});
  });

  it("requires the EDIT role", () => {
    state.editor = false;
    render(<ImageCategorization imageId="1" />);
    expect(screen.getByText("Change labels")).toBeDisabled();
    expect(screen.queryByText("Apply")).not.toBeInTheDocument();
  });

  it("guards leaving until changes are explicitly discarded", async () => {
    const user = userEvent.setup();
    const ref = createRef<CategorizationEditor>();
    const proceed = vi.fn();
    render(<ImageCategorization ref={ref} imageId="1" />);
    await user.click(screen.getByText("Change labels"));
    act(() => ref.current?.confirmLeave(proceed));
    expect(proceed).not.toHaveBeenCalled();
    await user.click(screen.getByText("Keep editing"));
    expect(proceed).not.toHaveBeenCalled();
    act(() => ref.current?.confirmLeave(proceed));
    await user.click(screen.getByText("Discard changes"));
    expect(proceed).toHaveBeenCalledOnce();
  });

  it("organizes without saving when labels are unchanged", async () => {
    const user = userEvent.setup();
    render(<ImageCategorization imageId="1" />);
    await user.click(screen.getByLabelText("Organized"));
    expect(state.update).not.toHaveBeenCalled();
    expect(state.organize).toHaveBeenCalledOnce();
  });

  it("applies pending labels before locking", async () => {
    const user = userEvent.setup();
    render(<ImageCategorization imageId="1" />);
    await user.click(screen.getByText("Change labels"));
    await user.click(screen.getByLabelText("Organized"));
    expect(state.update).toHaveBeenCalledWith({
      variables: { imageData: { id: "1", types: [], date: "2020-01-01" } },
    });
    expect(state.update.mock.invocationCallOrder[0]).toBeLessThan(
      state.organize.mock.invocationCallOrder[0],
    );
  });

  it("keeps the image unlocked when applying fails", async () => {
    state.update.mockRejectedValue(new Error("Save failed"));
    const user = userEvent.setup();
    render(<ImageCategorization imageId="1" />);
    await user.click(screen.getByText("Change labels"));
    await user.click(screen.getByLabelText("Organized"));
    expect(state.organize).not.toHaveBeenCalled();
    expect(screen.getByText("Save failed")).toBeInTheDocument();
  });
});
