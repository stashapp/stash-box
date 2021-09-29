import React from "react";
import { siteHref } from "src/utils/route";

const CLASSNAME = "SiteLink";
const CLASSNAME_ICON = `${CLASSNAME}-icon`;
const CLASSNAME_NAME = `${CLASSNAME}-name`;

interface Props {
  site: {
    id: string;
    name: string;
  } | null;
  hideName?: boolean;
}

const SiteLink: React.FC<Props> = ({ site, hideName = false }) =>
  site ? (
    <a href={siteHref(site)} className={CLASSNAME}>
      <img className={CLASSNAME_ICON} src={`/image/site/${site.id}`} alt="" />
      {!hideName && <span className={CLASSNAME_NAME}>{site.name}</span>}
    </a>
  ) : (
    <></>
  );

export default SiteLink;
