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
      rehypePlugins={[RehypeExternalLinks]}
      remarkRehypeOptions={{
        clobberPrefix: unique ? `${unique}-` : undefined,
      }}
      transformImageUri={() => ""}
    >
      {text}
    </ReactMarkdown>
  ) : null;
