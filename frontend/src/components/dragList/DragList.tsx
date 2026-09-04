import { faGripVertical } from "@fortawesome/free-solid-svg-icons";
import cx from "classnames";
import {
  type DragEvent,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useState,
} from "react";
import { Icon } from "src/components/fragments";

const CLASSNAME = "DragList";

interface Props<T> {
  items: T[];
  /** Stable identity, used as the React key so a moved row keeps its DOM node. */
  keyOf: (item: T) => string;
  /** Names the item in the handle's accessible label. */
  labelOf: (item: T) => string;
  onReorder: (items: T[]) => void;
  children: (item: T) => ReactNode;
  /** Row treatment. Rows default to a single line; `is-block` hosts a card. */
  className?: string;
}

// A list reordered by dragging a grip handle
// Rows are only draggable while the pointer is over their handle, otherwise
// they'd make nested controls impossible to use
// We also support keyboard navigation for accessibility
export function DragList<T>({
  items,
  keyOf,
  labelOf,
  onReorder,
  children,
  className,
}: Props<T>) {
  const [draft, setDraft] = useState(items);
  const [dragIndex, setDragIndex] = useState<number>();
  const [armedIndex, setArmedIndex] = useState<number>();

  useEffect(() => {
    if (dragIndex === undefined) setDraft(items);
  }, [items, dragIndex]);

  const reordered = (from: number, to: number): T[] | undefined => {
    if (to < 0 || to >= draft.length || to === from) return undefined;
    const next = [...draft];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    return next;
  };

  // If dragIndex is set that means we're handling our own drag event
  // and none of those belonging to any of our potential nested children
  const owned = dragIndex !== undefined;

  const onDragStart = (event: DragEvent<HTMLLIElement>, index: number) => {
    event.stopPropagation();
    event.dataTransfer.effectAllowed = "move";
    setDragIndex(index);
  };

  // Reordering as the cursor passes each row means the list previews the
  // result so there is no separate drop indicator to keep in sync
  const onDragEnter = (event: DragEvent<HTMLLIElement>, index: number) => {
    if (!owned) return;
    event.stopPropagation();

    const next = reordered(dragIndex, index);
    if (next) {
      setDraft(next);
      setDragIndex(index);
    }
    event.dataTransfer.dropEffect = "move";
    event.preventDefault();
  };

  const onDrop = (event: DragEvent<HTMLLIElement>) => {
    if (!owned) return;
    event.stopPropagation();

    setDragIndex(undefined);
    setArmedIndex(undefined);
    onReorder(draft);
  };

  const onKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    const step =
      event.key === "ArrowUp" ? -1 : event.key === "ArrowDown" ? 1 : 0;
    if (step === 0) return;

    const next = reordered(index, index + step);
    event.preventDefault();
    if (!next) return;

    setDraft(next);
    onReorder(next);
  };

  return (
    <ul
      className={cx(CLASSNAME, className)}
      onDragOver={(event) => {
        event.dataTransfer.dropEffect = "move";
        event.preventDefault();
      }}
    >
      {draft.map((item, index) => (
        <li
          key={keyOf(item)}
          className={cx(`${CLASSNAME}-row`, {
            "is-dragging": dragIndex === index,
          })}
          draggable={armedIndex === index}
          onDragStart={(event) => onDragStart(event, index)}
          onDragEnter={(event) => onDragEnter(event, index)}
          onDragEnd={(event) => {
            if (!owned) return;
            event.stopPropagation();
            setDragIndex(undefined);
            setArmedIndex(undefined);
          }}
          onDrop={onDrop}
        >
          <button
            type="button"
            className={`${CLASSNAME}-handle`}
            aria-label={`Reorder ${labelOf(item)}`}
            title="Drag to reorder, or use the arrow keys"
            onMouseEnter={() => setArmedIndex(index)}
            onMouseLeave={() => setArmedIndex(undefined)}
            onFocus={() => setArmedIndex(index)}
            onBlur={() => setArmedIndex(undefined)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            <Icon icon={faGripVertical} />
          </button>
          <div className={`${CLASSNAME}-content`}>{children(item)}</div>
        </li>
      ))}
    </ul>
  );
}
