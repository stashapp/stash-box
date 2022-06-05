import { FC, useContext } from "react";
import { Link } from "react-router-dom";
import { Button, Col, Form, InputGroup, Row } from "react-bootstrap";
import Select from "react-select";
import { debounce } from "lodash-es";
import {
  faSortAmountUp,
  faSortAmountDown,
} from "@fortawesome/free-solid-svg-icons";

import {
  usePerformers,
  SortDirectionEnum,
  GenderFilterEnum,
  PerformerSortEnum,
} from "src/graphql";
import { usePagination, useQueryParams } from "src/hooks";
import { ErrorMessage, Icon } from "src/components/fragments";
import PerformerCard from "src/components/performerCard";
import { canEdit, ensureEnum, resolveEnum } from "src/utils";
import AuthContext from "src/AuthContext";
import { List } from "src/components/list";
import { ROUTE_PERFORMER_ADD, GenderFilterTypes } from "src/constants";

const PER_PAGE = 25;

const genderOptions = Object.keys(GenderFilterEnum).map((g) => ({
  value: g,
  label: GenderFilterTypes[g as GenderFilterEnum],
}));
const sortOptions = [
  { value: PerformerSortEnum.NAME, label: "Name" },
  { value: PerformerSortEnum.BIRTHDATE, label: "Birthdate" },
  { value: PerformerSortEnum.SCENE_COUNT, label: "Scene Count" },
  { value: PerformerSortEnum.CAREER_START_YEAR, label: "Career Start" },
  { value: PerformerSortEnum.DEBUT, label: "Scene Debut" },
  { value: PerformerSortEnum.CREATED_AT, label: "Created At" },
];

const PerformersComponent: FC = () => {
  const auth = useContext(AuthContext);
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
  const favorite = params.favorite === "true";
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

  if (!loading && !data)
    return <ErrorMessage error="Failed to load performers" />;

  const performers = (data?.queryPerformers.performers ?? []).map(
    (performer) => (
      <Col xs="auto" key={performer.id}>
        <PerformerCard performer={performer} />
      </Col>
    )
  );

  const debouncedHandler = debounce(setParams, 200);

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
      <InputGroup className="performer-sort ms-2 me-3">
        <Form.Select
          onChange={(e) =>
            setParams("sort", e.currentTarget.value.toLowerCase())
          }
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
            setParams(
              "direction",
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
