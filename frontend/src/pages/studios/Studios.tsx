import { getRouteApi, Link } from "@tanstack/react-router";
import type { FC } from "react";
import { Button, Card, Form } from "react-bootstrap";
import { FavoriteStar } from "src/components/fragments";
import { List } from "src/components/list";
import { ROUTE_STUDIO_ADD } from "src/constants/route";
import { SortDirectionEnum, StudioSortEnum, useStudios } from "src/graphql";
import { useCurrentUser, useDebouncedCallback, usePagination } from "src/hooks";
import { useUpdateSearch } from "src/hooks/useUpdateSearch";

const routeApi = getRouteApi("/narrow/studios/");

const PER_PAGE = 40;

const StudiosComponent: FC = () => {
  const { isEditor } = useCurrentUser();
  const params = routeApi.useSearch();
  const updateSearch = useUpdateSearch();
  const favorite = params.favorite === true || undefined;
  const parentOnly = params.parents === true;
  const hasParent = parentOnly ? false : undefined;
  const { page, setPage } = usePagination();
  const { loading, data } = useStudios({
    input: {
      names: params.query,
      is_favorite: favorite,
      has_parent: hasParent,
      page,
      per_page: PER_PAGE,
      direction: SortDirectionEnum.ASC,
      sort: StudioSortEnum.NAME,
    },
  });

  const studioList = data?.queryStudios.studios.map((s) => (
    <li key={s.id} className={s.parent === null ? "fw-bold" : ""}>
      <Link to="/studios/$id" params={s}>
        {s.name}
      </Link>
      {s.parent && (
        <small className="bullet-separator text-muted">
          <Link to="/studios/$id" params={s.parent}>
            {s.parent.name}
          </Link>
        </small>
      )}
      <FavoriteStar entity={s} entityType="studio" className="ps-2" />
    </li>
  ));

  const debouncedHandler = useDebouncedCallback(updateSearch, 200);

  const filters = (
    <>
      <Form.Control
        id="studio-query"
        onChange={(e) => debouncedHandler({ query: e.currentTarget.value })}
        placeholder="Filter studio name"
        defaultValue={params.query ?? ""}
        className="w-25 me-3"
      />
      <Form.Group controlId="favorite">
        <Form.Check
          className="mt-2"
          type="switch"
          label="Only favorites"
          defaultChecked={favorite}
          onChange={(e) => updateSearch({ favorite: e.currentTarget.checked })}
        />
      </Form.Group>
      <Form.Group controlId="parentOnly" className="ms-3">
        <Form.Check
          className="mt-2"
          type="switch"
          label="Only parent networks"
          defaultChecked={parentOnly}
          onChange={(e) => updateSearch({ parents: e.currentTarget.checked })}
        />
      </Form.Group>
    </>
  );

  return (
    <>
      <div className="d-flex">
        <h3 className="me-4">Studios</h3>
        {isEditor && (
          <Link to={ROUTE_STUDIO_ADD} className="ms-auto">
            <Button className="me-auto">Create</Button>
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
          <Card.Body>
            <ul>{studioList}</ul>
          </Card.Body>
        </Card>
      </List>
    </>
  );
};

export default StudiosComponent;
