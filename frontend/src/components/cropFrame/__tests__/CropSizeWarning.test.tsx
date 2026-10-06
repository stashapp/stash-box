import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import CropSizeWarning from "../CropSizeWarning";
import { CROP_SIZE_WARNINGS } from "../geometry";

// The one warning renderer every edit-diff component shares,
// so covering it here covers the amendable path and the plain path alike
describe("CropSizeWarning", () => {
  it("renders nothing without a verdict worth flagging", () => {
    const { container } = render(<CropSizeWarning />);
    expect(container).toBeEmptyDOMElement();

    const { container: ok } = render(<CropSizeWarning verdict="ok" />);
    expect(ok).toBeEmptyDOMElement();
  });

  it("names the doubt and takes its wording from the shared table", () => {
    render(<CropSizeWarning verdict="marginal" />);
    const warning = screen.getByText("Small");
    expect(warning.closest("div")?.className).toContain("text-warning");
    expect(warning.closest("div")?.title).toBe(CROP_SIZE_WARNINGS.marginal);
  });

  it("drops the doubt from the wording once the verdict is settled", () => {
    render(<CropSizeWarning verdict="too-small" />);
    const warning = screen.getByText("Too small");
    expect(warning.closest("div")?.className).toContain("text-danger");
    expect(warning.closest("div")?.title).toBe(CROP_SIZE_WARNINGS["too-small"]);
  });
});
