import type { FC } from "react";

import { useSearchScenes } from "src/graphql";
import { usePagination } from "src/hooks";
import { List } from "src/components/list";
import { LoadingIndicator } from "src/components/fragments";

import { SceneCard } from "./SceneCard";

interface Props {
  term: string;
}

const PER_PAGE = 20;

export const SearchScenesTab: FC<Props> = ({ term }) => {
  const { page, setPage } = usePagination();

  const { loading, data } = useSearchScenes(
    {
      term: term ?? "",
      page,
      per_page: PER_PAGE,
    },
    !term,
  );

  if (!term) {
    return null;
  }

  if (loading && !data) {
    return <LoadingIndicator message="Searching scenes..." />;
  }

  const scenes = data?.searchScene.scenes ?? [];
  const count = data?.searchScene.count ?? 0;

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
