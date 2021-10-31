import React from "react";
import { Helmet } from "react-helmet";

// Title is only injected in production, so default to Stash-Box in dev
const INSTANCE_TITLE =
  document.title === "{{.}}" ? "Stash-Box" : document.title;

interface Props {
  page?: string;
}

const Title: React.FC<Props> = ({ page }) => (
  <Helmet>
    <title>{page ? `${page} | ${INSTANCE_TITLE}` : INSTANCE_TITLE}</title>
  </Helmet>
);

export default Title;
