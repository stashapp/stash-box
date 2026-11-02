import {
  faSortAmountDown,
  faSortAmountUp,
} from "@fortawesome/free-solid-svg-icons";
import { getRouteApi } from "@tanstack/react-router";
import { type FC, Fragment } from "react";
import { Button, Col, Form, InputGroup, Row } from "react-bootstrap";
import Select from "react-select";
import { Icon } from "src/components/fragments";
import { List } from "src/components/list";
import PerformerCard from "src/components/performerCard";
import { GenderFilterTypes } from "src/constants";
import {
  GenderFilterEnum,
  PerformerSortEnum,
  SortDirectionEnum,
  useScenePairings,
} from "src/graphql";
import { useDebouncedCallback, usePagination } from "src/hooks";
import { useUpdateSearch } from "src/hooks/useUpdateSearch";
import { searchEnum } from "src/routing/search";
import { PairingRow } from "./pairingRow";

const routeApi = getRouteApi("/narrow/performers/$id");

const PER_PAGE = 25;
const SCENES_PER_PAGE = 12;

const genderOptions = Object.entries(GenderFilterEnum).map(([, value]) => ({
  value,
  label: GenderFilterTypes[value],
}));
const sortOptions = [
  { value: PerformerSortEnum.NAME, label: "Name" },
  { value: PerformerSortEnum.SHARED_SCENE_COUNT, label: "Scenes Together" },
  { value: PerformerSortEnum.BIRTHDATE, label: "Birthdate" },
  { value: PerformerSortEnum.SCENE_COUNT, label: "Scene Count" },
  { value: PerformerSortEnum.CAREER_START_YEAR, label: "Career Start" },
  { value: PerformerSortEnum.DEBUT, label: "Scene Debut" },
  { value: PerformerSortEnum.CREATED_AT, label: "Created At" },
];

interface Props {
  id: string;
}

export const ScenePairings: FC<Props> = ({ id }) => {
  const params = routeApi.useSearch();
  const updateSearch = useUpdateSearch();
  const gender = params.gender;
  const direction = params.dir ?? SortDirectionEnum.DESC;
  const sort =
    searchEnum(PerformerSortEnum, params.sort) ??
    PerformerSortEnum.SHARED_SCENE_COUNT;
  const favorite = params.favorite === true || undefined;
  const fetchScenes = params.scenes === true;
  const { page, setPage } = usePagination();

  const { data, loading } = useScenePairings({
    performerId: id,
    names: params.query,
    gender,
    favorite,
    page,
    per_page: PER_PAGE,
    sort,
    direction,
    fetchScenes,
    scenesPerPage: SCENES_PER_PAGE,
  });

  const performers = data?.queryPerformers.performers;

  const debouncedHandler = useDebouncedCallback(updateSearch, 200);

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
                direction === SortDirectionEnum.DESC
                  ? SortDirectionEnum.ASC
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
          label="Favorites"
          defaultChecked={favorite}
          onChange={(e) => updateSearch({ favorite: e.currentTarget.checked })}
        />
      </Form.Group>
      <Form.Group controlId="scenes">
        <Form.Check
          className="mt-2 ms-2"
          type="switch"
          label="Scenes"
          defaultChecked={fetchScenes}
          onChange={(e) => updateSearch({ scenes: e.currentTarget.checked })}
        />
      </Form.Group>
    </>
  );

  return (
    <List
      entityName="Scene Pairings"
      page={page}
      filters={filters}
      setPage={setPage}
      perPage={PER_PAGE}
      loading={loading}
      listCount={data?.queryPerformers?.count}
    >
      {fetchScenes ? (
        performers?.map((p, i) => (
          <Fragment key={p.id}>
            <PairingRow
              performerId={id}
              partner={p}
              sceneCount={p.queryScenes.count}
              firstPage={p.queryScenes.scenes ?? []}
              perPage={SCENES_PER_PAGE}
            />
            {i < performers.length - 1 && <hr />}
          </Fragment>
        ))
      ) : (
        <Row>
          {performers?.map((p) => (
            <Col xs={3} key={p.id}>
              <PerformerCard performer={p} />
              <div className="text-center text-muted mb-3">
                {p.queryScenes.count} scene{p.queryScenes.count !== 1 && "s"}{" "}
                together
              </div>
            </Col>
          ))}
        </Row>
      )}
    </List>
  );
};
