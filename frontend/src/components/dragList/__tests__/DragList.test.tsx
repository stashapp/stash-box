import { fireEvent, screen } from "@testing-library/react";
import { renderForm } from "src/test/renderForm";
import { describe, expect, it, vi } from "vitest";
import { DragList } from "../DragList";

const ITEMS = [
  { key: "a", name: "Alpha" },
  { key: "b", name: "Bravo" },
  { key: "c", name: "Charlie" },
];

const setup = (onReorder = vi.fn()) => {
  const utils = renderForm(
    <DragList
      items={ITEMS}
      keyOf={(item) => item.key}
      labelOf={(item) => item.name}
      onReorder={onReorder}
    >
      {(item) => <span>{item.name}</span>}
    </DragList>,
  );
  return { ...utils, onReorder };
};

const order = () =>
  [...document.querySelectorAll(".DragList-content")].map(
    (el) => el.textContent,
  );

const handles = () => screen.getAllByRole("button");
const rows = () => [...document.querySelectorAll(".DragList-row")];

// jsdom does not implement DataTransfer, and React reads dropEffect off it
const dataTransfer = () => ({ effectAllowed: "", dropEffect: "" });

// A list of lists should be a valid setup
const nested = (outer: () => void, inner: () => void) => {
  renderForm(
    <DragList
      className="is-block"
      items={ITEMS}
      keyOf={(item) => item.key}
      labelOf={(item) => item.name}
      onReorder={outer}
    >
      {(item) => (
        <DragList
          items={[
            { key: `${item.key}-1`, name: `${item.name} one` },
            { key: `${item.key}-2`, name: `${item.name} two` },
          ]}
          keyOf={(child) => child.key}
          labelOf={(child) => child.name}
          onReorder={inner}
        >
          {(child) => <span>{child.name}</span>}
        </DragList>
      )}
    </DragList>,
  );

  const outerRows = () => [
    ...document.querySelectorAll<HTMLElement>(
      ".DragList.is-block > .DragList-row",
    ),
  ];
  return {
    outerRows,
    innerRowsOf: (index: number) => [
      ...outerRows()[index].querySelectorAll<HTMLElement>(
        ".DragList-row .DragList-row",
      ),
    ],
  };
};

describe("DragList", () => {
  describe("keyboard", () => {
    it("moves an item down and reports the new order", async () => {
      const { user, onReorder } = setup();

      handles()[0].focus();
      await user.keyboard("{ArrowDown}");

      expect(order()).toEqual(["Bravo", "Alpha", "Charlie"]);
      expect(onReorder).toHaveBeenCalledWith([ITEMS[1], ITEMS[0], ITEMS[2]]);
    });

    it("moves an item up", async () => {
      const { user, onReorder } = setup();

      handles()[2].focus();
      await user.keyboard("{ArrowUp}");

      expect(order()).toEqual(["Alpha", "Charlie", "Bravo"]);
      expect(onReorder).toHaveBeenCalledWith([ITEMS[0], ITEMS[2], ITEMS[1]]);
    });

    it("does nothing at the ends", async () => {
      const { user, onReorder } = setup();

      handles()[0].focus();
      await user.keyboard("{ArrowUp}");
      handles()[2].focus();
      await user.keyboard("{ArrowDown}");

      expect(order()).toEqual(["Alpha", "Bravo", "Charlie"]);
      expect(onReorder).not.toHaveBeenCalled();
    });

    it("keeps focus on the item that moved, so it can be moved again", async () => {
      const { user } = setup();

      handles()[0].focus();
      await user.keyboard("{ArrowDown}{ArrowDown}");

      expect(order()).toEqual(["Bravo", "Charlie", "Alpha"]);
    });
  });

  describe("dragging", () => {
    it("arms a row only while its handle is hovered", async () => {
      const { user } = setup();

      expect(rows().map((row) => row.getAttribute("draggable"))).toEqual([
        "false",
        "false",
        "false",
      ]);

      await user.hover(handles()[1]);
      expect(rows()[1]).toHaveAttribute("draggable", "true");
      expect(rows()[0]).toHaveAttribute("draggable", "false");

      await user.unhover(handles()[1]);
      expect(rows()[1]).toHaveAttribute("draggable", "false");
    });

    it("previews the reorder while dragging and commits on drop", () => {
      const { onReorder } = setup();

      fireEvent.dragStart(rows()[0], { dataTransfer: dataTransfer() });
      fireEvent.dragEnter(rows()[2], { dataTransfer: dataTransfer() });

      // Moved in the list before the drop, so the list previews the result
      expect(order()).toEqual(["Bravo", "Charlie", "Alpha"]);
      expect(onReorder).not.toHaveBeenCalled();

      fireEvent.drop(rows()[2], { dataTransfer: dataTransfer() });
      expect(onReorder).toHaveBeenCalledWith([ITEMS[1], ITEMS[2], ITEMS[0]]);
    });

    it("does not disturb an enclosing list", () => {
      const outer = vi.fn();
      const inner = vi.fn();
      const { outerRows, innerRowsOf } = nested(outer, inner);

      fireEvent.dragStart(innerRowsOf(0)[0], { dataTransfer: dataTransfer() });
      fireEvent.dragEnter(innerRowsOf(0)[1], { dataTransfer: dataTransfer() });
      fireEvent.drop(innerRowsOf(0)[1], { dataTransfer: dataTransfer() });

      expect(inner).toHaveBeenCalledTimes(1);
      expect(outer).not.toHaveBeenCalled();

      // The outer list still holds its original order
      expect(
        outerRows().map(
          (row) => row.querySelector(".DragList-handle")?.ariaLabel,
        ),
      ).toEqual(["Reorder Alpha", "Reorder Bravo", "Reorder Charlie"]);
    });

    it("lets an enclosing list reorder over its rows", () => {
      const outer = vi.fn();
      const inner = vi.fn();
      const { outerRows, innerRowsOf } = nested(outer, inner);

      fireEvent.dragStart(outerRows()[0], { dataTransfer: dataTransfer() });
      // Enter a row of the *inner* list belonging to the second group.
      fireEvent.dragEnter(innerRowsOf(1)[0], { dataTransfer: dataTransfer() });
      fireEvent.drop(innerRowsOf(1)[0], { dataTransfer: dataTransfer() });

      expect(outer).toHaveBeenCalledWith([ITEMS[1], ITEMS[0], ITEMS[2]]);
      expect(inner).not.toHaveBeenCalled();
    });

    it("ignores drag movement that never started on a row", () => {
      const { onReorder } = setup();

      fireEvent.dragEnter(rows()[2], { dataTransfer: dataTransfer() });

      expect(order()).toEqual(["Alpha", "Bravo", "Charlie"]);
      expect(onReorder).not.toHaveBeenCalled();
    });
  });
});
