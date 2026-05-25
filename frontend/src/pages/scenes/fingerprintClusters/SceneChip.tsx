import type { CSSProperties, FC, ReactNode } from "react";

interface Props {
  color: string;
  isSeed?: boolean;
  isHighlighted?: boolean;
  children: ReactNode;
  title?: string;
  style?: CSSProperties;
}

// Single styling source for every scene chip in the cluster UI. Plain span
// so no bootstrap utility classes (e.g. .bg-primary) fight the inline
// background color.
export const SceneChip: FC<Props> = ({
  color,
  isSeed,
  isHighlighted,
  children,
  title,
  style,
}) => (
  <span
    title={title}
    className="d-inline-flex align-items-center"
    style={{
      backgroundColor: color,
      color: "#fff",
      borderRadius: "0.375rem",
      padding: "2px 8px",
      fontSize: 11,
      fontWeight: 500,
      lineHeight: 1.4,
      border: isHighlighted
        ? "2px solid #ffd54f"
        : isSeed
          ? "2px solid #fff"
          : "2px solid transparent",
      boxShadow: isHighlighted
        ? "0 0 0 2px rgba(255, 213, 79, 0.5)"
        : undefined,
      ...style,
    }}
  >
    {isSeed ? <span className="me-1">★</span> : null}
    {children}
  </span>
);
