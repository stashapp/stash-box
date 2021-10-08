import React, { useContext } from "react";
import { Button, Card, Form } from "react-bootstrap";
import { Link, useHistory } from "react-router-dom";
import { studioHref, createHref, canEdit } from "src/utils";
import { ROUTE_STUDIO_ADD } from "src/constants/route";
import { debounce } from "lodash";
import AuthContext from "src/AuthContext";
import querystring from "query-string";

import { useStudios, SortDirectionEnum } from "src/graphql";
import { usePagination } from "src/hooks";
import { List } from "src/components/list";

const PER_PAGE = 40;

const StudiosComponent: React.FC = () => {
  const history = useHistory();
  const auth = useContext(AuthContext);
  const queries = querystring.parse(history.location.search);
  const query = Array.isArray(queries.query) ? queries.query[0] : queries.query;
  const { page, setPage } = usePagination();
  const { loading, data } = useStudios({
    filter: {
      page,
      per_page: PER_PAGE,
      direction: SortDirectionEnum.ASC,
    },
    studioFilter: {
      names: query,
    },
  });

  const studioList = data?.queryStudios.studios.map((s) => (
    <li key={s.id} className={s.parent === null ? "font-weight-bold" : ""}>
      <Link to={studioHref(s)}>{s.name}</Link>
      {s.parent && (
        <small className="bullet-separator text-muted">
          <Link to={studioHref(s.parent)}>{s.parent.name}</Link>
        </small>
      )}
    </li>
  ));

  const handleQuery = (q: string) => {
    const qs = querystring.stringify({
      ...querystring.parse(history.location.search),
      query: q || undefined,
      page: undefined,
    });
    history.replace(`${history.location.pathname}?${qs}`);
  };
  const debouncedHandler = debounce(handleQuery, 200);

  const filters = (
    <Form.Control
      id="tag-query"
      onChange={(e) => debouncedHandler(e.currentTarget.value)}
      placeholder="Filter studio name"
      className="w-25"
    />
  );

  return (
    <>
      <div className="d-flex">
        <h3 className="mr-4">Studios</h3>
        {canEdit(auth.user) && (
          <Link to={createHref(ROUTE_STUDIO_ADD)} className="ml-auto">
            <Button className="mr-auto">Create</Button>
          </Link>
        )}
      </div>
      <List
        entityName="studios"
        page={page}
        setPage={setPage}
        perPage={PER_PAGE}
        filters={filters}
        loading={loading}
        listCount={data?.queryStudios.count}
      >
        <Card>
          <Card.Body>{studioList}</Card.Body>
        </Card>
      </List>
    </>
  );
};

export default StudiosComponent;
