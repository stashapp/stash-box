import { FC, useContext } from "react";
import { Link, useHistory } from "react-router-dom";
import { Button, Col, Form, InputGroup, Row } from "react-bootstrap";
import Select from "react-select";
import querystring from "query-string";
import { debounce } from "lodash-es";
import {
  faSortAmountUp,
  faSortAmountDown,
} from "@fortawesome/free-solid-svg-icons";

import {
  usePerformers,
  SortDirectionEnum,
  GenderFilterEnum,
} from "src/graphql";
import { usePagination } from "src/hooks";
import { ErrorMessage, Icon } from "src/components/fragments";
import PerformerCard from "src/components/performerCard";
import { canEdit } from "src/utils";
import AuthContext from "src/AuthContext";
import { List } from "src/components/list";
import { ROUTE_PERFORMER_ADD, GenderFilterTypes } from "src/constants";

const PER_PAGE = 20;

const genderOptions = Object.keys(GenderFilterEnum).map((g) => ({
  value: g,
  label: GenderFilterTypes[g as GenderFilterEnum],
}));
const sortOptions = [
  { value: "", label: "Name" },
  { value: "birthdate", label: "Birthdate" },
  { value: "scene_count", label: "Scene Count" },
  { value: "career_start_year", label: "Career Start" },
  { value: "debut", label: "Scene Debut" },
  { value: "created_at", label: "Created At" },
];

const PerformersComponent: FC = () => {
  const history = useHistory();
  const auth = useContext(AuthContext);
  const queries = querystring.parse(history.location.search);
  const query = Array.isArray(queries.query) ? queries.query[0] : queries.query;
  const gender = Array.isArray(queries.gender)
    ? queries.gender[0]
    : queries.gender;
  const direction =
    (Array.isArray(queries.dir) ? queries.dir[0] : queries.dir) ===
    SortDirectionEnum.DESC
      ? SortDirectionEnum.DESC
      : SortDirectionEnum.ASC;
  const sort = Array.isArray(queries.sort) ? queries.sort[0] : queries.sort;
  const favorite =
    (Array.isArray(queries.favorite)
      ? queries.favorite[0]
      : queries.favorite) === "true";
  const { page, setPage } = usePagination();
  const { loading, data } = usePerformers({
    filter: {
      page,
      per_page: PER_PAGE,
      sort: sort || "name",
      direction,
    },
    performerFilter: {
      name: query || undefined,
      gender: gender ? (gender as GenderFilterEnum) : undefined,
      is_favorite: favorite || undefined,
    },
  });

  if (!loading && !data)
    return <ErrorMessage error="Failed to load performers" />;

  const performers = (data?.queryPerformers.performers ?? []).map(
    (performer) => (
      <Col xs={3} key={performer.id}>
        <PerformerCard performer={performer} />
      </Col>
    )
  );

  const handleQuery = (name: string, value?: string) => {
    const qs = querystring.stringify({
      ...querystring.parse(history.location.search),
      [name]: value || undefined,
      page: undefined,
    });
    history.replace(`${history.location.pathname}?${qs}`);
  };
  const debouncedHandler = debounce(handleQuery, 200);

  const filters = (
    <>
      <Form.Control
        id="performer-name"
        onChange={(e) => debouncedHandler("query", e.currentTarget.value)}
        placeholder="Filter performer name"
        defaultValue={query ?? ""}
        className="w-auto"
      />
      <Select
        id="performer-gender"
        options={genderOptions}
        placeholder="Gender"
        isClearable
        onChange={(e) => handleQuery("gender", e?.value ?? undefined)}
        classNamePrefix="react-select"
        className="performer-filter ms-2"
      />
      <InputGroup className="performer-sort ms-2 me-3">
        <Form.Select
          onChange={(e) => handleQuery("sort", e.currentTarget.value)}
          defaultValue={sort ?? "name"}
        >
          {sortOptions.map((s) => (
            <option value={s.value} key={s.value}>
              {s.label}
            </option>
          ))}
        </Form.Select>
        <Button
          variant="secondary"
          onClick={() =>
            handleQuery(
              "dir",
              direction === SortDirectionEnum.ASC
                ? SortDirectionEnum.DESC
                : undefined
            )
          }
        >
          <Icon
            icon={
              direction === SortDirectionEnum.DESC
                ? faSortAmountDown
                : faSortAmountUp
            }
          />
        </Button>
      </InputGroup>
      <Form.Group controlId="favorite">
        <Form.Check
          className="mt-2"
          type="switch"
          label="Only favorites"
          defaultChecked={favorite}
          onChange={(e) =>
            handleQuery(
              "favorite",
              e.currentTarget.checked ? "true" : undefined
            )
          }
        />
      </Form.Group>
    </>
  );

  return (
    <>
      <div className="d-flex">
        <h3 className="me-4">Performers</h3>
        {canEdit(auth.user) && (
          <Link to={ROUTE_PERFORMER_ADD} className="ms-auto">
            <Button>Create</Button>
          </Link>
        )}
      </div>
      <List
        entityName="performers"
        page={page}
        filters={filters}
        setPage={setPage}
        loading={loading}
        listCount={data?.queryPerformers.count}
      >
        <Row>{performers}</Row>
      </List>
    </>
  );
};

export default PerformersComponent;
