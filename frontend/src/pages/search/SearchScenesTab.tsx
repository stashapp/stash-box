import { type FC, useEffect } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import { LoadingIndicator } from "src/components/fragments";
import { List } from "src/components/list";
import { useSearchScenes } from "src/graphql";
import { usePagination } from "src/hooks";

import { SceneCard } from "./SceneCard";
import type { SearchLayoutOutletContext } from "./SearchLayout";

const PER_PAGE = 20;

export const SearchScenesTab: FC = () => {
  const [searchParams] = useSearchParams();
  const term = searchParams.get("q") ?? "";
  const { page, setPage } = usePagination();
  const { setSceneCount } = useOutletContext<SearchLayoutOutletContext>();

  const { loading, data } = useSearchScenes(
    {
      term: term ?? "",
      page,
      per_page: PER_PAGE,
    },
    !term,
  );

  useEffect(() => {
    setSceneCount(data?.searchScenes.count);
  }, [data?.searchScenes.count, setSceneCount]);

  if (!term) {
    return null;
  }

  if (loading && !data) {
    return <LoadingIndicator message="Searching scenes..." />;
  }

  const scenes = data?.searchScenes.scenes ?? [];
  const count = data?.searchScenes.count ?? 0;

  return (
    <List
      entityName="scenes"
      page={page}
      setPage={setPage}
      perPage={PER_PAGE}
      loading={loading}
      listCount={count}
    >
      <div>
        {scenes.map((s) => (
          <SceneCard scene={s} key={s.id} />
        ))}
      </div>
    </List>
  );
};
