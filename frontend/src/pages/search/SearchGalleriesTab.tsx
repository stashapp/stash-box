import type { FC } from "react";
import { useSearchParams } from "react-router-dom";
import { LoadingIndicator } from "src/components/fragments";
import { List } from "src/components/list";
import { useSearchGalleries } from "src/graphql";
import { usePagination } from "src/hooks";
import { GalleryCard } from "./GalleryCard";

const PER_PAGE = 20;

export const SearchGalleriesTab: FC = () => {
  const [searchParams] = useSearchParams();
  const term = searchParams.get("q") ?? "";
  const { page, setPage } = usePagination();
  const { loading, data } = useSearchGalleries(
    { term, page, per_page: PER_PAGE },
    !term,
  );

  if (!term) return null;
  if (loading && !data)
    return <LoadingIndicator message="Searching galleries..." />;

  const galleries = data?.searchGalleries.galleries ?? [];
  return (
    <List
      entityName="galleries"
      page={page}
      setPage={setPage}
      perPage={PER_PAGE}
      loading={loading}
      listCount={data?.searchGalleries.count ?? 0}
    >
      <div>
        {galleries.map((gallery) => (
          <GalleryCard gallery={gallery} key={gallery.id} />
        ))}
      </div>
    </List>
  );
};
