import { type FC, useMemo } from "react";
import { Link } from "react-router-dom";
import { Markdown, userHref } from "src/utils";

interface Mention {
  id: string;
  name: string;
}

interface Props {
  text: string | null | undefined;
  unique?: string;
  mentions?: readonly Mention[];
}

// Matches stored @<uuid> tokens. Leading boundary char must not be alphanumeric
// so things like `foo@<uuid>` don't accidentally match.
const MENTION_RE =
  /(^|[^A-Za-z0-9_])@([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/g;

const linkifyMentions =
  (lookup: Map<string, string>) =>
  (text: string): React.ReactNode => {
    if (lookup.size === 0) return text;
    const parts: React.ReactNode[] = [];
    let last = 0;
    let matched = false;
    for (const m of text.matchAll(MENTION_RE)) {
      const lead = m[1];
      const uuid = m[2];
      const name = lookup.get(uuid.toLowerCase());
      if (!name) continue;
      matched = true;
      const start = (m.index ?? 0) + lead.length;
      if (start > last) parts.push(text.slice(last, start));
      parts.push(
        <Link key={`${start}-${uuid}`} to={userHref({ name })}>
          @{name}
        </Link>,
      );
      last = start + uuid.length + 1;
    }
    if (!matched) return text;
    if (last < text.length) parts.push(text.slice(last));
    return <>{parts}</>;
  };

/**
 * Renders an edit comment's markdown body, swapping `@<uuid>` tokens for
 * profile links using the comment's resolved `mentions` list.
 */
const CommentMarkdown: FC<Props> = ({ text, unique, mentions }) => {
  const transformText = useMemo(() => {
    const lookup = new Map<string, string>(
      (mentions ?? []).map((m) => [m.id.toLowerCase(), m.name]),
    );
    if (lookup.size === 0) return undefined;
    return linkifyMentions(lookup);
  }, [mentions]);

  return <Markdown text={text} unique={unique} transformText={transformText} />;
};

export default CommentMarkdown;
