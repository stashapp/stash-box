import { useApolloClient, useQuery } from "@apollo/client/react";
import cx from "classnames";
import debounce from "p-debounce";
import {
  type ChangeEvent,
  type FC,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Form, Tab, Tabs } from "react-bootstrap";
import type { UseFormRegister } from "react-hook-form";
import Select, { type GroupBase, type SelectInstance } from "react-select";
import EditComment from "src/components/editCard/EditComment";
import {
  extractMentionNames,
  MAX_MENTIONS,
  rewriteMentionsToIds,
} from "src/components/editCard/mentions";
import {
  FindUsersByNamesDocument,
  type FindUsersByNamesQuery,
  type FindUsersByNamesQueryVariables,
  SearchUsersDocument,
  type SearchUsersQuery,
  type SearchUsersQueryVariables,
} from "src/graphql";
import { useCurrentUser } from "src/hooks";
import { getCaretCoordinates } from "./textareaCaret";

interface MentionUser {
  id: string;
  name: string;
}

interface MentionOption {
  value: string;
  label: string;
}

interface MentionState {
  start: number;
  end: number;
  query: string;
  anchor: { top: number; left: number };
}

interface IProps {
  onChange?: (text: string) => void;
  className?: string;
  register?: UseFormRegister<{ note: string }>;
  hasError?: boolean;
  initialValue?: string;
  /** Users to seed the @mention dropdown with — typically edit participants. */
  participants?: readonly MentionUser[];
}

const anchorBelowAt = (
  el: HTMLTextAreaElement,
  position: number,
): { top: number; left: number } => {
  const caret = getCaretCoordinates(el, position);
  const rect = el.getBoundingClientRect();
  return {
    top: rect.top + caret.top - el.scrollTop + caret.height,
    left: rect.left + caret.left - el.scrollLeft,
  };
};

const toOption = (u: MentionUser): MentionOption => ({
  value: u.id,
  label: u.name,
});

const dedupeOptions = (opts: MentionOption[]): MentionOption[] => {
  const seen = new Set<string>();
  return opts.filter((o) => {
    if (seen.has(o.value)) return false;
    seen.add(o.value);
    return true;
  });
};

type MentionSelect = SelectInstance<
  MentionOption,
  false,
  GroupBase<MentionOption>
>;

const NoteInput: FC<IProps> = ({
  onChange,
  className,
  register,
  hasError = false,
  initialValue = "",
  participants,
}) => {
  const { user } = useCurrentUser();
  const client = useApolloClient();
  const [comment, setComment] = useState(initialValue);
  const [mention, setMention] = useState<MentionState | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const selectRef = useRef<MentionSelect | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  // Set by keydown when the user types '@', read by the next input event so we
  // only auto-open the dropdown for a fresh @ keystroke (not when the caret
  // happens to land inside an existing token).
  const pendingOpen = useRef(false);

  const registered = register?.("note");
  const { ref: rhfRef, ...registeredRest } = registered ?? {
    ref: undefined,
    name: "note",
  };
  const setRef = (el: HTMLTextAreaElement | null) => {
    textareaRef.current = el;
    if (rhfRef) rhfRef(el);
  };

  const participantOptions = useMemo(
    () => dedupeOptions((participants ?? []).map(toOption)),
    [participants],
  );

  const [options, setOptions] = useState<MentionOption[]>(participantOptions);
  const [isLoading, setIsLoading] = useState(false);
  const fetchSeq = useRef(0);

  const runFetch = useMemo(
    () =>
      debounce(async (term: string, seq: number) => {
        const res = await client.query<
          SearchUsersQuery,
          SearchUsersQueryVariables
        >({
          query: SearchUsersDocument,
          variables: { term, limit: 8 },
          fetchPolicy: "network-only",
        });
        if (seq !== fetchSeq.current) return;
        const fetched = (res.data?.searchUsers ?? []).map(toOption);
        const prefix = term.toLowerCase();
        const seeded = participantOptions.filter((o) =>
          o.label.toLowerCase().startsWith(prefix),
        );
        setOptions(dedupeOptions([...seeded, ...fetched]));
        setIsLoading(false);
      }, 150),
    [client, participantOptions],
  );

  useEffect(() => {
    if (!mention) return;
    const trimmed = mention.query.trim();
    if (!trimmed) {
      fetchSeq.current += 1;
      setIsLoading(false);
      setOptions(participantOptions);
      return;
    }
    const seq = ++fetchSeq.current;
    setIsLoading(true);
    runFetch(trimmed, seq);
  }, [mention, participantOptions, runFetch]);

  const updateValue = (next: string) => {
    setComment(next);
    onChange?.(next);
  };

  const openMentionAt = (el: HTMLTextAreaElement, at: number) => {
    const anchor = anchorBelowAt(el, at + 1);
    const caret = el.selectionStart ?? at + 1;
    setMention({
      start: at,
      end: caret,
      query: el.value.slice(at + 1, caret),
      anchor,
    });
  };

  const handleInput = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    const next = el.value;
    const caret = el.selectionStart ?? next.length;
    updateValue(next);

    if (pendingOpen.current) {
      pendingOpen.current = false;
      // The just-typed '@' sits at caret - 1.
      const at = caret - 1;
      if (at >= 0 && next[at] === "@") {
        const before = at > 0 ? next[at - 1] : "";
        if (at === 0 || /[\s([{]/.test(before)) {
          openMentionAt(el, at);
          return;
        }
      }
    }

    if (!mention) return;
    // Update the active mention as the user keeps typing. Close if they
    // deleted the originating '@' or moved before it.
    if (next[mention.start] !== "@" || caret < mention.start + 1) {
      setMention(null);
      return;
    }
    const query = next.slice(mention.start + 1, caret);
    if (query !== mention.query || caret !== mention.end) {
      setMention({ ...mention, end: caret, query });
    }
  };

  const insertMention = (selected: MentionUser) => {
    if (!mention) return;
    const before = comment.slice(0, mention.start);
    const after = comment.slice(mention.end);
    const needsQuotes = /[\s"]/.test(selected.name);
    const insert = needsQuotes ? `@"${selected.name}"` : `@${selected.name}`;
    const next = `${before}${insert} ${after}`;
    const caret = before.length + insert.length + 1;
    const el = textareaRef.current;
    updateValue(next);
    if (el) {
      // Textarea is uncontrolled (defaultValue), so push the new value into
      // the DOM and notify react-hook-form's onChange so the form state stays
      // in sync.
      el.value = next;
      registered?.onChange?.({ target: { name: "note", value: next } });
    }
    setMention(null);
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      el.setSelectionRange(caret, caret);
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!mention) {
      if (e.key === "@") pendingOpen.current = true;
      return;
    }
    const select = selectRef.current;
    if (e.key === "Escape") {
      e.preventDefault();
      setMention(null);
      return;
    }
    if (!select) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      select.focusOption("down");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      select.focusOption("up");
    } else if (e.key === "Enter" || e.key === "Tab") {
      const focused = select.state.focusedOption;
      if (focused) {
        e.preventDefault();
        insertMention({ id: focused.value, name: focused.label });
      }
    }
  };

  // Close the dropdown when the user mouses down anywhere outside of it.
  useEffect(() => {
    if (!mention) return;
    const onMouseDown = (e: MouseEvent) => {
      const node = e.target as Node | null;
      if (dropdownRef.current && node && dropdownRef.current.contains(node))
        return;
      setMention(null);
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [mention]);

  const now = new Date().toISOString();

  return (
    <div className={cx("NoteInput", { "is-invalid": hasError })}>
      <Tabs id="add-comment">
        <Tab eventKey="write" title="Write" className="NoteInput-tab">
          <Form.Control
            as="textarea"
            ref={setRef}
            className={className}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            rows={5}
            defaultValue={initialValue}
            {...registeredRest}
          />
          {mention && (
            <div
              ref={dropdownRef}
              className="NoteInput-mentions"
              style={{ top: mention.anchor.top, left: mention.anchor.left }}
            >
              <Select<MentionOption>
                ref={selectRef}
                menuIsOpen
                options={options}
                isLoading={isLoading}
                inputValue={mention.query}
                value={null}
                controlShouldRenderValue={false}
                isClearable={false}
                hideSelectedOptions={false}
                tabSelectsValue={false}
                menuShouldBlockScroll
                noOptionsMessage={({ inputValue }) =>
                  inputValue.length === 0
                    ? "No participants yet"
                    : "No matching users"
                }
                onChange={(opt) =>
                  opt && insertMention({ id: opt.value, name: opt.label })
                }
                components={{
                  Control: () => null,
                  IndicatorsContainer: () => null,
                }}
                classNamePrefix="react-select"
              />
            </div>
          )}
        </Tab>
        <Tab eventKey="preview" title="Preview" unmountOnExit mountOnEnter>
          <MentionsPreview
            id={`${user?.id}-${now}`}
            comment={comment}
            date={now}
            user={user}
          />
        </Tab>
      </Tabs>
    </div>
  );
};

interface MentionsPreviewProps {
  id: string;
  comment: string;
  date: string;
  user?: { id: string; name: string } | null;
}

const MentionsPreview: FC<MentionsPreviewProps> = ({
  id,
  comment,
  date,
  user,
}) => {
  // Mirror the backend: only the first MAX_MENTIONS distinct names resolve to
  // a link; the rest stay as plain @<name> text.
  const names = useMemo(
    () => extractMentionNames(comment).slice(0, MAX_MENTIONS),
    [comment],
  );
  const { data } = useQuery<
    FindUsersByNamesQuery,
    FindUsersByNamesQueryVariables
  >(FindUsersByNamesDocument, {
    variables: { names },
    skip: names.length === 0,
  });
  const resolved = useMemo(() => data?.findUsersByNames ?? [], [data]);
  const rewritten = useMemo(() => {
    if (resolved.length === 0) return comment;
    const lookup = new Map(resolved.map((u) => [u.name.toLowerCase(), u.id]));
    return rewriteMentionsToIds(comment, lookup);
  }, [comment, resolved]);

  return (
    <EditComment
      id={id}
      comment={rewritten}
      date={date}
      user={user}
      mentions={resolved}
      preview
    />
  );
};

export default NoteInput;
