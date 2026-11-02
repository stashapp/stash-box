import {
  faSortAmountDown,
  faSortAmountUp,
} from "@fortawesome/free-solid-svg-icons";
import { getRouteApi, Link } from "@tanstack/react-router";
import type { FC } from "react";
import { Button, Col, Form, InputGroup, Row } from "react-bootstrap";
import Select from "react-select";
import { ErrorMessage, Icon } from "src/components/fragments";
import { List } from "src/components/list";
import PerformerCard from "src/components/performerCard";
import { GenderFilterTypes, ROUTE_PERFORMER_ADD } from "src/constants";
import {
  GenderFilterEnum,
  PerformerSortEnum,
  SortDirectionEnum,
  usePerformers,
} from "src/graphql";
import { useCurrentUser, useDebouncedCallback, usePagination } from "src/hooks";
import { useUpdateSearch } from "src/hooks/useUpdateSearch";
import { searchEnum } from "src/routing/search";

const routeApi = getRouteApi("/narrow/performers/");

const PER_PAGE = 25;

const genderOptions = Object.entries(GenderFilterEnum).map(([, value]) => ({
  value,
  label: GenderFilterTypes[value],
}));
const sortOptions = [
  { value: PerformerSortEnum.NAME, label: "Name" },
  { value: PerformerSortEnum.BIRTHDATE, label: "Birthdate" },
  { value: PerformerSortEnum.SCENE_COUNT, label: "Scene Count" },
  { value: PerformerSortEnum.CAREER_START_YEAR, label: "Career Start" },
  { value: PerformerSortEnum.DEBUT, label: "Scene Debut" },
  { value: PerformerSortEnum.LAST_SCENE, label: "Latest Scene" },
  { value: PerformerSortEnum.POPULARITY, label: "Popularity" },
  { value: PerformerSortEnum.CREATED_AT, label: "Created At" },
  { value: PerformerSortEnum.UPDATED_AT, label: "Updated At" },
];

const PerformersComponent: FC = () => {
  const { isEditor } = useCurrentUser();
  const params = routeApi.useSearch();
  const updateSearch = useUpdateSearch();
  const gender = params.gender;
  const direction = params.dir;
  const sort = params.sort;
  const favorite = params.favorite === true || undefined;
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

  const debouncedHandler = useDebouncedCallback(updateSearch, 200);

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
        onChange={(e) => debouncedHandler({ query: e.currentTarget.value })}
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
        onChange={(e) => updateSearch({ gender: e?.value ?? undefined })}
        classNamePrefix="react-select"
        className="performer-filter ms-2"
      />
      <InputGroup className="performer-sort ms-2 me-3">
        <Form.Select
          onChange={(e) =>
            updateSearch({
              sort: searchEnum(PerformerSortEnum, e.currentTarget.value),
            })
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
            updateSearch({
              dir:
                direction === SortDirectionEnum.ASC
                  ? SortDirectionEnum.DESC
                  : undefined,
            })
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
          onChange={(e) => updateSearch({ favorite: e.currentTarget.checked })}
        />
      </Form.Group>
    </>
  );

  return (
    <>
      <div className="d-flex">
        <h3 className="me-4">Performers</h3>
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
