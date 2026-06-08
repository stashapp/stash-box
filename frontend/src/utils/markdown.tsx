import type { FC, ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import RehypeExternalLinks from "rehype-external-links";
import RemarkBreaks from "remark-breaks";
import RemarkGFM from "remark-gfm";

interface Props {
  text: string | null | undefined;
  unique?: string;
  /** Optional replacement applied to leaf text nodes after markdown parsing.
   *  Used by callers that need to inject inline React elements (e.g. links)
   *  into rendered text without affecting markdown semantics. */
  transformText?: (text: string) => ReactNode;
}

const transformChildren = (
  children: ReactNode,
  transform: (s: string) => ReactNode,
): ReactNode => {
  if (typeof children === "string") return transform(children);
  if (Array.isArray(children))
    return children.map((c) => (typeof c === "string" ? transform(c) : c));
  return children;
};

export const Markdown: FC<Props> = ({ text, unique, transformText }) => {
  if (!text) return null;

  const wrap = transformText
    ? (children: ReactNode) => transformChildren(children, transformText)
    : (children: ReactNode) => children;

  return (
    <ReactMarkdown
      remarkPlugins={[RemarkGFM, RemarkBreaks]}
      rehypePlugins={[
        [RehypeExternalLinks, { rel: ["nofollow", "noopener", "noreferrer"] }],
      ]}
      remarkRehypeOptions={{
        clobberPrefix: unique ? `${unique}-` : undefined,
      }}
      disallowedElements={["img"]}
      components={{
        input: (props) => (
          <input
            className={props.type === "checkbox" ? "form-check-input" : ""}
            {...props}
          />
        ),
        p: ({ children, ...rest }) => <p {...rest}>{wrap(children)}</p>,
        li: ({ children, ...rest }) => <li {...rest}>{wrap(children)}</li>,
        em: ({ children, ...rest }) => <em {...rest}>{wrap(children)}</em>,
        strong: ({ children, ...rest }) => (
          <strong {...rest}>{wrap(children)}</strong>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
};
