import React from "react";
import { Link } from "react-router-dom";
import { siteHref } from "src/utils/route";

const CLASSNAME = "SiteLink";
const CLASSNAME_ICON = `${CLASSNAME}-icon`;
const CLASSNAME_NAME = `${CLASSNAME}-name`;

interface Props {
  site: {
    id: string;
    name: string;
    icon: string;
  } | null;
  hideName?: boolean;
}

const SiteLink: React.FC<Props> = ({ site, hideName = false }) =>
  site ? (
    <Link to={siteHref(site)} className={CLASSNAME}>
      <img className={CLASSNAME_ICON} src={site.icon} alt="" />
      {!hideName && <span className={CLASSNAME_NAME}>{site.name}</span>}
    </Link>
  ) : (
    <></>
  );

export default SiteLink;
