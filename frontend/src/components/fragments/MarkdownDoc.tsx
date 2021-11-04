import React, { useEffect, useState } from "react";
import { Markdown } from "src/utils";

interface Props {
  doc: string;
}

const MarkdownDoc: React.FC<Props> = ({ doc }) => {
  const [markdown, setMarkdown] = useState<string | undefined>();
  console.log(markdown);

  useEffect(() => {
    if (!markdown) {
      fetch(doc)
        .then((res) => res.text())
        .then((text) => setMarkdown(text));
    }
  }, [doc, markdown]);

  return markdown ? <Markdown text={markdown} /> : <></>;
};

export default MarkdownDoc;
