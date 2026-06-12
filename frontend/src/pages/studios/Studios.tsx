import { debounce } from "lodash-es";
import type { FC } from "react";
import { Button, Card, Form } from "react-bootstrap";
import { Link } from "react-router-dom";
import { FavoriteStar } from "src/components/fragments";
import { List } from "src/components/list";
import { ROUTE_STUDIO_ADD } from "src/constants/route";
import { SortDirectionEnum, StudioSortEnum, useStudios } from "src/graphql";
import { useCurrentUser, usePagination, useQueryParams } from "src/hooks";
import { createHref, studioHref } from "src/utils";

const PER_PAGE = 40;

const StudiosComponent: FC = () => {
  const { isEditor } = useCurrentUser();
  const [params, setParams] = useQueryParams({
    query: { name: "query", type: "string", default: "" },
    favorite: { name: "favorite", type: "string", default: "false" },
    parentOnly: { name: "parents", type: "string", default: "false" },
  });
  const favorite = params.favorite === "true" || undefined;
  const parentOnly = params.parentOnly === "true";
  // Parent networks are studios without a parent.
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
      <Link to={studioHref(s)}>{s.name}</Link>
      {s.parent && (
        <small className="bullet-separator text-muted">
          <Link to={studioHref(s.parent)}>{s.parent.name}</Link>
        </small>
      )}
      <FavoriteStar entity={s} entityType="studio" className="ps-2" />
    </li>
  ));

  const debouncedHandler = debounce(setParams, 200);

  const filters = (
    <>
      <Form.Control
        id="studio-query"
        onChange={(e) => debouncedHandler("query", e.currentTarget.value)}
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
          onChange={(e) =>
            setParams("favorite", e.currentTarget.checked.toString())
          }
        />
      </Form.Group>
      <Form.Group controlId="parentOnly" className="ms-3">
        <Form.Check
          className="mt-2"
          type="switch"
          label="Only parent networks"
          defaultChecked={parentOnly}
          onChange={(e) =>
            setParams("parentOnly", e.currentTarget.checked.toString())
          }
        />
      </Form.Group>
    </>
  );

  return (
    <>
      <div className="d-flex">
        <h3 className="me-4">Studios</h3>
        {isEditor && (
          <Link to={createHref(ROUTE_STUDIO_ADD)} className="ms-auto">
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
