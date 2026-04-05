import type { FC } from "react";
import { Link } from "react-router-dom";

import { useSubStudios, SortDirectionEnum, StudioSortEnum } from "src/graphql";
import { LoadingIndicator } from "src/components/fragments";
import { studioHref } from "src/utils";

const PREVIEW_COUNT = 25;

interface Props {
  id: string;
  onViewAll: () => void;
}

export const SubStudioPreview: FC<Props> = ({ id, onViewAll }) => {
  const { data, loading } = useSubStudios({
    id,
    input: {
      page: 1,
      per_page: PREVIEW_COUNT,
      sort: StudioSortEnum.NAME,
      direction: SortDirectionEnum.ASC,
    },
  });

  const studios = data?.findStudio?.sub_studios.studios;
  const count = data?.findStudio?.sub_studios.count ?? 0;
  const hasMore = count > PREVIEW_COUNT;

  if (loading) return <LoadingIndicator message="Loading sub-studios..." />;

  return (
    <div className="sub-studio-list">
      <ul>
        {studios?.map((s) => (
          <li key={s.id}>
            <Link to={studioHref(s)}>{s.name}</Link>
          </li>
        ))}
        {hasMore && (
          <li key="view-all" style={{ listStyle: "none", marginLeft: "-1rem" }}>
            <button
              type="button"
              className="btn btn-link p-0"
              onClick={onViewAll}
            >
              View all {count} sub-studios
            </button>
          </li>
        )}
      </ul>
    </div>
  );
};
