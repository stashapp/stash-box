import { act, render, screen, waitFor } from "@testing-library/react";
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
vi.mock("src/components/image/ImageCategorizationFields", () => ({
  default: ({
    onChange,
    readOnly,
  }: {
    onChange: (value: unknown) => void;
    readOnly: boolean;
  }) => (
    <>
      <button
        type="button"
        disabled={readOnly}
        onClick={() => onChange({ types: [], date: "2020-01-01" })}
      >
        Change labels
      </button>
      <button
        type="button"
        onClick={() => onChange({ types: [], date: "2099-01-01" })}
      >
        Future date
      </button>
    </>
  ),
}));

describe("ImageCategorization", () => {
  beforeEach(() => {
    state.editor = true;
    state.image.organized = false;
    state.update.mockReset().mockResolvedValue({});
    state.organize.mockReset().mockResolvedValue({});
  });

  it("requires the EDIT role", () => {
    state.editor = false;
    render(<ImageCategorization imageId="1" />);
    expect(screen.getByText("Change labels")).toBeDisabled();
    expect(screen.queryByText("Save")).not.toBeInTheDocument();
  });

  it("keeps organized images read-only for editors", () => {
    state.image.organized = true;
    render(<ImageCategorization imageId="1" />);

    expect(screen.getByText("Change labels")).toBeDisabled();
    expect(screen.queryByText("Save")).not.toBeInTheDocument();
  });

  it("allows leaving after applying the draft", async () => {
    const user = userEvent.setup();
    const ref = createRef<CategorizationEditor>();
    const proceed = vi.fn();
    render(<ImageCategorization ref={ref} imageId="1" />);

    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    await user.click(screen.getByText("Change labels"));
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
    await user.click(screen.getByText("Save"));
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    act(() => ref.current?.confirmLeave(proceed));

    expect(state.update).toHaveBeenCalledOnce();
    expect(proceed).toHaveBeenCalledOnce();
    expect(screen.queryByText("Discard categorization changes?")).toBeNull();
  });

  it("prevents saving or organizing an out-of-range date", async () => {
    const user = userEvent.setup();
    render(<ImageCategorization imageId="1" />);

    await user.click(screen.getByText("Future date"));

    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    expect(screen.getByLabelText("Organized")).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Save" }));
    await user.click(screen.getByLabelText("Organized"));
    expect(state.update).not.toHaveBeenCalled();
    expect(state.organize).not.toHaveBeenCalled();

    await user.click(screen.getByText("Change labels"));
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
    expect(screen.getByLabelText("Organized")).toBeEnabled();
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
    let finishSave!: (value: object) => void;
    state.update.mockReturnValue(
      new Promise((resolve) => {
        finishSave = resolve;
      }),
    );

    const user = userEvent.setup();
    render(<ImageCategorization imageId="1" />);
    await user.click(screen.getByText("Change labels"));
    await user.click(screen.getByLabelText("Organized"));
    expect(state.update).toHaveBeenCalledWith({
      variables: { imageData: { id: "1", types: [], date: "2020-01-01" } },
    });
    expect(state.organize).not.toHaveBeenCalled();

    await act(async () => finishSave({}));

    await waitFor(() =>
      expect(state.organize).toHaveBeenCalledWith({
        variables: { input: { id: "1", organized: true } },
      }),
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
