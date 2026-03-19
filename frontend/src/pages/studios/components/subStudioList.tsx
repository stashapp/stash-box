import { type FC, useState, useMemo } from "react";
import { Card, Form } from "react-bootstrap";
import { Link } from "react-router-dom";
import { debounce } from "lodash-es";

import { useSubStudios, SortDirectionEnum, StudioSortEnum } from "src/graphql";
import { usePagination } from "src/hooks";
import { List } from "src/components/list";
import { LoadingIndicator } from "src/components/fragments";
import { studioHref } from "src/utils";

const PER_PAGE = 25;
const PREVIEW_COUNT = 25;

interface Props {
  id: string;
}

interface PreviewProps {
  id: string;
  onViewAll: () => void;
}

export const SubStudioPreview: FC<PreviewProps> = ({ id, onViewAll }) => {
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

export const SubStudioList: FC<Props> = ({ id }) => {
  const [filter, setFilter] = useState("");
  const names = filter || undefined;
  const { page, setPage } = usePagination();

  const { data, loading } = useSubStudios({
    id,
    input: {
      page,
      per_page: PER_PAGE,
      sort: StudioSortEnum.NAME,
      direction: SortDirectionEnum.ASC,
      names,
    },
  });

  const studios = data?.findStudio?.sub_studios.studios;
  const showLoading = loading && !studios;

  const debouncedSetFilter = useMemo(() => debounce(setFilter, 200), []);

  const filters = (
    <Form.Control
      id="sub-studio-name"
      onChange={(e) => debouncedSetFilter(e.currentTarget.value)}
      placeholder="Filter by name"
      className="w-auto"
    />
  );

  return (
    <List
      entityName="sub-studios"
      page={page}
      filters={filters}
      setPage={setPage}
      perPage={PER_PAGE}
      loading={showLoading}
      listCount={data?.findStudio?.sub_studios.count}
    >
      <Card>
        <Card.Body>
          <ul>
            {studios?.map((s) => (
              <li key={s.id}>
                <Link to={studioHref(s)}>{s.name}</Link>
              </li>
            ))}
          </ul>
        </Card.Body>
      </Card>
    </List>
  );
};
