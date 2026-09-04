import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import cx from "classnames";
import type { FC, ReactNode } from "react";

import Icon from "./Icon";

interface Props {
  heading?: string;
  icon?: IconDefinition;
  className?: string;
  children: ReactNode;
}

const CLASSNAME = "EditorCard";

/**
 * A bordered panel grouping one part of the image editor -- classification,
 * metadata -- so each reads as its own region instead of everything running
 * together in one column.
 */
const EditorCard: FC<Props> = ({ heading, icon, className, children }) => (
  <div className={cx(CLASSNAME, className)}>
    {heading && (
      <div className={`${CLASSNAME}-heading`}>
        {icon && <Icon icon={icon} className={`${CLASSNAME}-heading-icon`} />}
        {heading}
      </div>
    )}
    {children}
  </div>
);

export default EditorCard;
