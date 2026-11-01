import { Link } from "@tanstack/react-router";
import type { ComponentProps } from "react";

// For already-built URLs from edit data and shared presentation components.
// Route-specific navigation should use Link with typed `to` and `params`.
export const UrlLink = (props: ComponentProps<"a"> & { href: string }) => (
  <Link to="." {...props} />
);
