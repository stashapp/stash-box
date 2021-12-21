import React from "react";
import { Link } from "react-router-dom";
import cx from "classnames";
import { siteHref } from "src/utils/route";

const CLASSNAME = "SiteLink";
const CLASSNAME_ICON = `${CLASSNAME}-icon`;
const CLASSNAME_NAME = `${CLASSNAME}-name`;
const CLASSNAME_NO_MARGIN = `${CLASSNAME}-no-margin`;

interface Props {
  site: {
    id: string;
    name: string;
    icon: string;
  } | null;
  hideName?: boolean;
  noMargin?: boolean;
}

const SiteLink: React.FC<Props> = ({
  site,
  hideName = false,
  noMargin = false,
}) =>
  site ? (
    <Link to={siteHref(site)} className={CLASSNAME}>
      <img className={CLASSNAME_ICON} src={site.icon} alt="" />
      {!hideName && (
        <span
          className={cx(CLASSNAME_NAME, { [CLASSNAME_NO_MARGIN]: noMargin })}
        >
          {site.name}
        </span>
      )}
    </Link>
  ) : (
    <></>
  );

export default SiteLink;
