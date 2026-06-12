import { groupBy, sortBy } from "lodash-es";
import type { FC } from "react";
import { SiteLink } from "src/components/fragments";

interface URL {
  url: string;
  site: {
    id: string;
    name: string;
    icon: string;
    category?: {
      id: number;
      name: string;
      sort_order: number;
    } | null;
  } | null;
}

interface URLListProps {
  urls: URL[];
}

const renderURL = (u: URL) => (
  <li key={u.url}>
    <SiteLink site={u.site} />
    <a href={u.url} target="_blank" rel="noreferrer noopener">
      {u.url}
    </a>
  </li>
);

const URLList: FC<URLListProps> = ({ urls }) => {
  const groups = sortBy(
    Object.values(groupBy(urls, (u) => u.site?.category?.id ?? "")),
    [
      (group) => (group[0].site?.category ? 0 : 1),
      (group) => group[0].site?.category?.sort_order ?? 0,
      (group) => group[0].site?.category?.name.toLowerCase(),
    ],
  );

  return (
    <>
      {groups.map((group) => (
        <div key={group[0].site?.category?.id ?? "other"}>
          <h6>{group[0].site?.category?.name ?? "Other"}</h6>
          <ul className="URLList">{group.map(renderURL)}</ul>
        </div>
      ))}
    </>
  );
};

export default URLList;
