import React from "react";
import { SiteLink } from "src/components/fragments";

interface URLListProps {
  urls: {
    url: string;
    site: {
      id: string;
      name: string;
    } | null;
  }[];
}

const URLList: React.FC<URLListProps> = ({ urls }) => (
  <ul className="URLList">
    {urls.map((u) => (
      <li key={u.url}>
        <SiteLink site={u.site} hideName />
        <a href={u.url} target="_blank" rel="noreferrer noopener">
          {u.url}
        </a>
      </li>
    ))}
  </ul>
);

export default URLList;
