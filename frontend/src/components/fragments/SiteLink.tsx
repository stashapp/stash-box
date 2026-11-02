import { Link } from "@tanstack/react-router";
import cx from "classnames";
import type { FC } from "react";

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

const SiteLink: FC<Props> = ({ site, hideName = false, noMargin = false }) =>
  site && (
    <Link to="/sites/$id" params={site} className={CLASSNAME}>
      <img className={CLASSNAME_ICON} src={site.icon} alt="" />
      {!hideName && (
        <span
          className={cx(CLASSNAME_NAME, { [CLASSNAME_NO_MARGIN]: noMargin })}
        >
          {site.name}
        </span>
      )}
    </Link>
  );

export default SiteLink;
