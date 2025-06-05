import { FC } from "react";
import ReactMarkdown from "react-markdown";
import RemarkGFM from "remark-gfm";
import RemarkBreaks from "remark-breaks";
import RehypeExternalLinks from "rehype-external-links";

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
