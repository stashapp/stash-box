import { useHistory, useLocation } from 'react-router-dom';
import queryString from 'query-string';

const usePagination = () => {
    const history = useHistory();
    const location = useLocation();
    const queryPage = queryString.parse(location.search).page;
    const page = Number.parseInt(Array.isArray(queryPage) ? queryPage[0] : queryPage, 10) || 1;

    const setPage = (pageNumber:number) => history.push({ search: pageNumber === 1 ? '' : `?page=${pageNumber}` });

    return { page, setPage };
};

export default usePagination;
