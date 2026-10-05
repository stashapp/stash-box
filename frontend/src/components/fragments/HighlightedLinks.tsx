import { sortBy } from "lodash-es";
import type { FC } from "react";

interface URL {
  url: string;
  site: {
    icon: string;
    name: string;
    highlighted: boolean;
    category?: {
      name: string;
      sort_order: number;
    } | null;
  };
}

interface Props {
  urls: URL[];
}

// The row floats right, so render in reverse sort order to keep the
// first-sorted links anchored at the right edge as the list grows.
const HighlightedLinks: FC<Props> = ({ urls }) => (
  <div className="float-end">
    {sortBy(
      urls.filter((u) => u.site.highlighted),
      [
        (u) => (u.site.category ? 0 : 1),
        (u) => u.site.category?.sort_order ?? 0,
        (u) => u.site.category?.name.toLowerCase(),
        (u) => u.site.name.toLowerCase(),
        (u) => u.url,
      ],
    )
      .reverse()
      .map((u) => (
        <a href={u.url} target="_blank" rel="noreferrer noopener" key={u.url}>
          <img src={u.site.icon} alt="" className="SiteLink-icon" />
        </a>
      ))}
  </div>
);

export default HighlightedLinks;
