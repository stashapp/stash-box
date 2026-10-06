import type { FC } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import { Link } from "react-router-dom";
import Select from "react-select";
import { ErrorMessage } from "src/components/fragments";
import { List } from "src/components/list";
import PerformerCard from "src/components/performerCard";
import {
  GenderFilterTypes,
  ROUTE_PERFORMER_ADD,
  ROUTE_PERFORMER_SEARCH,
} from "src/constants";
import {
  GenderFilterEnum,
  PerformerSortEnum,
  SortDirectionEnum,
  usePerformers,
} from "src/graphql";
import {
  useCurrentUser,
  useDebouncedCallback,
  usePagination,
  useQueryParams,
} from "src/hooks";
import { ensureEnum, resolveEnum } from "src/utils";
import { PerformerSort } from "./components";

const PER_PAGE = 25;

const genderOptions = Object.entries(GenderFilterEnum).map(([, value]) => ({
  value,
  label: GenderFilterTypes[value],
}));
const PerformersComponent: FC = () => {
  const { isEditor } = useCurrentUser();
  const [params, setParams] = useQueryParams({
    query: { name: "query", type: "string", default: "" },
    gender: { name: "gender", type: "string" },
    direction: { name: "dir", type: "string", default: SortDirectionEnum.ASC },
    sort: { name: "sort", type: "string", default: PerformerSortEnum.NAME },
    favorite: { name: "favorite", type: "string", default: "false" },
  });
  const gender = resolveEnum(GenderFilterEnum, params.gender);
  const direction = ensureEnum(SortDirectionEnum, params.direction);
  const sort = ensureEnum(PerformerSortEnum, params.sort);
  const favorite = params.favorite === "true" || undefined;
  const { page, setPage } = usePagination();
  const { loading, data } = usePerformers({
    input: {
      names: params.query,
      gender,
      is_favorite: favorite,
      page,
      per_page: PER_PAGE,
      sort,
      direction,
    },
  });

  const debouncedHandler = useDebouncedCallback(setParams, 200);

  if (!loading && !data)
    return <ErrorMessage error="Failed to load performers" />;

  const performers = (data?.queryPerformers.performers ?? []).map(
    (performer) => (
      <Col xs="auto" key={performer.id}>
        <PerformerCard performer={performer} />
      </Col>
    ),
  );

  const filters = (
    <>
      <Form.Control
        id="performer-name"
        onChange={(e) => debouncedHandler("query", e.currentTarget.value)}
        placeholder="Filter performer name"
        defaultValue={params.query}
        className="w-auto"
      />
      <Select
        id="performer-gender"
        options={genderOptions}
        defaultValue={genderOptions.find((o) => o.value === gender)}
        placeholder="Gender"
        isClearable
        onChange={(e) => setParams("gender", e?.value ?? undefined)}
        classNamePrefix="react-select"
        className="performer-filter ms-2"
      />
      <PerformerSort
        sort={sort}
        direction={direction}
        onSortChange={(value) => setParams("sort", value)}
        onDirectionChange={(value) =>
          setParams(
            "direction",
            value === SortDirectionEnum.ASC ? undefined : value,
          )
        }
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
    </>
  );

  return (
    <>
      <div className="d-flex">
        <h3 className="me-4">Performers</h3>
        <Link to={ROUTE_PERFORMER_SEARCH}>
          <Button variant="secondary">Advanced Search</Button>
        </Link>
        {isEditor && (
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
        perPage={PER_PAGE}
        loading={loading}
        listCount={data?.queryPerformers.count}
      >
        <Row>{performers}</Row>
      </List>
    </>
  );
};

export default PerformersComponent;
