import { useFilterSearch, useUpdateSearch } from "./useUpdateSearch";

const usePagination = () => {
  const { page = 1 } = useFilterSearch();
  const updateSearch = useUpdateSearch();

  const setPage = (pageNumber: number) => updateSearch({ page: pageNumber });

  return { page, setPage };
};

export default usePagination;
