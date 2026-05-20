import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useFingerprintSelection } from "../useFingerprintSelection";

const HASHES = ["a", "b", "c", "d", "e"];

describe("useFingerprintSelection", () => {
  describe("toggleFingerprint", () => {
    it("selects an unselected item", () => {
      const { result } = renderHook(() => useFingerprintSelection());
      act(() => result.current.toggleFingerprint("a"));
      expect(result.current.selectedFingerprints).toEqual(new Set(["a"]));
    });

    it("deselects an already-selected item", () => {
      const { result } = renderHook(() => useFingerprintSelection());
      act(() => result.current.toggleFingerprint("a"));
      act(() => result.current.toggleFingerprint("a"));
      expect(result.current.selectedFingerprints).toEqual(new Set());
    });

    it("selects multiple independent items", () => {
      const { result } = renderHook(() => useFingerprintSelection());
      act(() => result.current.toggleFingerprint("a"));
      act(() => result.current.toggleFingerprint("c"));
      expect(result.current.selectedFingerprints).toEqual(new Set(["a", "c"]));
    });
  });

  describe("toggleFingerprintRange", () => {
    it("selects a forward range from anchor", () => {
      const { result } = renderHook(() => useFingerprintSelection());
      act(() => result.current.toggleFingerprint("b"));
      act(() => result.current.toggleFingerprintRange("d", HASHES));
      expect(result.current.selectedFingerprints).toEqual(
        new Set(["b", "c", "d"]),
      );
    });

    it("selects a backward range from anchor", () => {
      const { result } = renderHook(() => useFingerprintSelection());
      act(() => result.current.toggleFingerprint("d"));
      act(() => result.current.toggleFingerprintRange("b", HASHES));
      expect(result.current.selectedFingerprints).toEqual(
        new Set(["b", "c", "d"]),
      );
    });

    it("deselects a range when the target is already selected", () => {
      const { result } = renderHook(() => useFingerprintSelection());
      act(() => result.current.toggleAllFingerprints(HASHES));
      act(() => result.current.toggleFingerprint("b"));
      act(() => result.current.toggleFingerprintRange("d", HASHES));
      expect(result.current.selectedFingerprints).toEqual(new Set(["a", "e"]));
    });

    it("selects only the clicked item when there is no anchor", () => {
      const { result } = renderHook(() => useFingerprintSelection());
      act(() => result.current.toggleFingerprintRange("c", HASHES));
      expect(result.current.selectedFingerprints).toEqual(new Set(["c"]));
    });

    it("updates the anchor so a second range extends from the last shift-click", () => {
      const { result } = renderHook(() => useFingerprintSelection());
      act(() => result.current.toggleFingerprint("a"));
      act(() => result.current.toggleFingerprintRange("c", HASHES));
      // anchor is now "c"; next range should extend from "c"
      act(() => result.current.toggleFingerprintRange("e", HASHES));
      expect(result.current.selectedFingerprints).toEqual(
        new Set(["a", "b", "c", "d", "e"]),
      );
    });
  });

  describe("toggleAllFingerprints", () => {
    it("selects all when nothing is selected", () => {
      const { result } = renderHook(() => useFingerprintSelection());
      act(() => result.current.toggleAllFingerprints(HASHES));
      expect(result.current.selectedFingerprints).toEqual(new Set(HASHES));
    });

    it("clears all when any items are selected", () => {
      const { result } = renderHook(() => useFingerprintSelection());
      act(() => result.current.toggleFingerprint("b"));
      act(() => result.current.toggleAllFingerprints(HASHES));
      expect(result.current.selectedFingerprints).toEqual(new Set());
    });

    it("clears all when all items are selected", () => {
      const { result } = renderHook(() => useFingerprintSelection());
      act(() => result.current.toggleAllFingerprints(HASHES));
      act(() => result.current.toggleAllFingerprints(HASHES));
      expect(result.current.selectedFingerprints).toEqual(new Set());
    });

    it("resets the anchor so the next range has no anchor", () => {
      const { result } = renderHook(() => useFingerprintSelection());
      act(() => result.current.toggleFingerprint("b")); // anchor = "b"
      act(() => result.current.toggleAllFingerprints(HASHES)); // clears (non-empty), anchor = null
      act(() => result.current.toggleFingerprintRange("c", HASHES));
      // no anchor → only "c" selected
      expect(result.current.selectedFingerprints).toEqual(new Set(["c"]));
    });
  });

  describe("clearSelection", () => {
    it("empties the selection", () => {
      const { result } = renderHook(() => useFingerprintSelection());
      act(() => result.current.toggleAllFingerprints(HASHES));
      act(() => result.current.clearSelection());
      expect(result.current.selectedFingerprints).toEqual(new Set());
    });

    it("resets the anchor so the next range has no anchor", () => {
      const { result } = renderHook(() => useFingerprintSelection());
      act(() => result.current.toggleFingerprint("b"));
      act(() => result.current.clearSelection());
      act(() => result.current.toggleFingerprintRange("d", HASHES));
      expect(result.current.selectedFingerprints).toEqual(new Set(["d"]));
    });
  });
});
