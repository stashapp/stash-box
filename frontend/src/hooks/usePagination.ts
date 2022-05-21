import { useQueryParams } from "src/hooks";

const usePagination = () => {
  const [{ page }, setParams] = useQueryParams({
    page: { name: "page", type: "number", default: 1 },
  });

  const setPage = (pageNumber: number) => setParams("page", pageNumber);

  return { page, setPage };
};

export default usePagination;
