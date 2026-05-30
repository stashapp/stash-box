import cx from "classnames";
import type { FC, ReactNode } from "react";

interface Props {
  color: string;
  isSeed?: boolean;
  children: ReactNode;
  title?: string;
}

// Per-chip background color is data-driven (palette per scene id) so it stays
// inline; everything else is in _styles.scss.
export const SceneChip: FC<Props> = ({ color, isSeed, children, title }) => (
  <span
    title={title}
    className={cx("SceneChip", { "SceneChip-seed": isSeed })}
    style={{ backgroundColor: color }}
  >
    {isSeed ? <span className="me-1">★</span> : null}
    {children}
  </span>
);
