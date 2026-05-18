import type { FC } from "react";
import ReactMarkdown from "react-markdown";
import RehypeExternalLinks from "rehype-external-links";
import RemarkBreaks from "remark-breaks";
import RemarkGFM from "remark-gfm";

interface Props {
  text: string | null | undefined;
  unique?: string;
}

export const Markdown: FC<Props> = ({ text, unique }) =>
  text ? (
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
      }}
    >
      {text}
    </ReactMarkdown>
  ) : null;
