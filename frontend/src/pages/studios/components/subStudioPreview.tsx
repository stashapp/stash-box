import { Link } from "@tanstack/react-router";
import type { FC } from "react";
import { ListSkeleton } from "src/components/loading/Skeleton";
import { SortDirectionEnum, StudioSortEnum, useSubStudios } from "src/graphql";

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

  if (loading) return <ListSkeleton label="Loading sub-studios" rows={2} />;

  return (
    <div className="sub-studio-list">
      <ul>
        {studios?.map((s) => (
          <li key={s.id}>
            <Link to="/studios/$id" params={s}>
              {s.name}
            </Link>
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
