import { FC } from "react";
import ReactMarkdown from "react-markdown";
import RemarkGFM from "remark-gfm";
import RemarkBreaks from "remark-breaks";
import RehypeExternalLinks from "rehype-external-links";

interface Props {
  text: string | null | undefined;
}

export const Markdown: FC<Props> = ({ text }) =>
  text ? (
    <ReactMarkdown
      remarkPlugins={[RemarkGFM, RemarkBreaks]}
      rehypePlugins={[RehypeExternalLinks]}
      transformImageUri={() => ""}
    >
      {text}
    </ReactMarkdown>
  ) : null;
