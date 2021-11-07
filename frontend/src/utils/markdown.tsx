import { FC } from "react";
import ReactMarkdown from "react-markdown";
import RemarkGFM from "remark-gfm";
import RemarkBreaks from "remark-breaks";
import RemarkExternalLinks from "remark-external-links";

interface Props {
  text: string | null | undefined;
}

export const Markdown: FC<Props> = ({ text }) =>
  text ? (
    <ReactMarkdown
      remarkPlugins={[RemarkGFM, RemarkBreaks, RemarkExternalLinks]}
      transformImageUri={() => ""}
    >
      {text}
    </ReactMarkdown>
  ) : null;
