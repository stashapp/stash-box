import { useHistory, useLocation } from "react-router-dom";
import queryString from "query-string";

const usePagination = () => {
  const history = useHistory();
  const location = useLocation();
  const queryPage = queryString.parse(location.search).page;
  const page = queryPage
    ? Number.parseInt(
        Array.isArray(queryPage) ? queryPage[0] ?? "1" : queryPage,
        10
      )
    : 1;

  const setPage = (pageNumber: number) => {
    history.push({
      search: queryString.stringify({
        ...queryString.parse(location.search),
        page: pageNumber === 1 ? undefined : pageNumber,
      }),
      hash: history.location.hash,
    });
  };

  return { page, setPage };
};

export default usePagination;
