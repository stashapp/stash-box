import {
  faSortAmountDown,
  faSortAmountUp,
} from "@fortawesome/free-solid-svg-icons";
import { getRouteApi } from "@tanstack/react-router";
import { type FC, Fragment } from "react";
import { Button, Form, InputGroup } from "react-bootstrap";
import Select from "react-select";
import { Icon } from "src/components/fragments";
import { List } from "src/components/list";
import { GenderFilterTypes } from "src/constants";
import {
  GenderFilterEnum,
  PerformerSortEnum,
  SortDirectionEnum,
  useStudioPerformers,
} from "src/graphql";
import { useDebouncedCallback, usePagination } from "src/hooks";
import { useUpdateSearch } from "src/hooks/useUpdateSearch";
import { searchEnum } from "src/routing/search";
import { StudioPerformerRow } from "./studioPerformerRow";

const routeApi = getRouteApi("/narrow/studios/$id");

const PER_PAGE = 25;
const SCENES_PER_PAGE = 12;

const genderOptions = Object.entries(GenderFilterEnum).map(([, value]) => ({
  value,
  label: GenderFilterTypes[value],
}));
const sortOptions = [
  { value: PerformerSortEnum.LAST_SCENE, label: "Latest Scene" },
  { value: PerformerSortEnum.DEBUT, label: "First Scene" },
  { value: PerformerSortEnum.NAME, label: "Name" },
  { value: PerformerSortEnum.SCENE_COUNT, label: "Scene Count" },
];

interface Props {
  id: string;
}

export const StudioPerformers: FC<Props> = ({ id }) => {
  const params = routeApi.useSearch();
  const updateSearch = useUpdateSearch();
  const gender = params.gender;
  const direction = params.dir ?? SortDirectionEnum.DESC;
  const sort =
    searchEnum(PerformerSortEnum, params.sort) ?? PerformerSortEnum.LAST_SCENE;
  const favorite = params.favorite === true || undefined;
  const names = params.query || undefined;
  const { page, setPage } = usePagination();

  const { data, loading } = useStudioPerformers({
    studioId: id,
    gender,
    favorite,
    names,
    page,
    per_page: PER_PAGE,
    sort,
    direction,
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
          label="Only favorites"
          defaultChecked={favorite}
          onChange={(e) => updateSearch({ favorite: e.currentTarget.checked })}
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
      {performers?.map((p, i) => (
        <Fragment key={p.id}>
          <StudioPerformerRow
            studioId={id}
            performer={p}
            sceneCount={p.queryScenes.count}
            firstPage={p.queryScenes.scenes}
            perPage={SCENES_PER_PAGE}
          />
          {i < performers.length - 1 && <hr />}
        </Fragment>
      ))}
    </List>
  );
};
