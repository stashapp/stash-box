import { FC } from "react";
import Select from "react-select";
import { Button, Col, Form, InputGroup, Row } from "react-bootstrap";
import {
  faSortAmountUp,
  faSortAmountDown,
} from "@fortawesome/free-solid-svg-icons";

import {
  useScenes,
  FavoriteFilter,
  SceneQueryInput,
  SortDirectionEnum,
  SceneSortEnum,
  CriterionModifier,
} from "src/graphql";
import { usePagination, useQueryParams } from "src/hooks";
import { ensureEnum } from "src/utils";
import SceneCard from "src/components/sceneCard";
import TagFilter from "src/components/tagFilter";
import { ErrorMessage, Icon } from "src/components/fragments";
import List from "./List";

const PER_PAGE = 20;

interface Props {
  perPage?: number;
  filter?: Partial<SceneQueryInput>;
  favoriteFilter?: "performer" | "studio" | "all";
}

const sortOptions = [
  { value: SceneSortEnum.DATE, label: "Release Date" },
  { value: SceneSortEnum.TITLE, label: "Title" },
  { value: SceneSortEnum.TRENDING, label: "Trending" },
  { value: SceneSortEnum.CREATED_AT, label: "Created At" },
  { value: SceneSortEnum.UPDATED_AT, label: "Updated At" },
];

const SceneList: FC<Props> = ({
  perPage = PER_PAGE,
  filter,
  favoriteFilter,
}) => {
  const [params, setParams] = useQueryParams({
    sort: { name: "sort", type: "string", default: SceneSortEnum.DATE },
    dir: { name: "dir", type: "string", default: SortDirectionEnum.DESC },
    favorite: { name: "favorite", type: "string", default: "NONE" },
    tag: { name: "tag", type: "string" },
  });
  const sort = ensureEnum(SceneSortEnum, params.sort);
  const direction = ensureEnum(SortDirectionEnum, params.dir);
  const favorite =
    params.favorite !== "NONE" && ensureEnum(FavoriteFilter, params.favorite);

  const { page, setPage } = usePagination();
  const { loading, data } = useScenes({
    input: {
      page,
      per_page: perPage,
      sort,
      direction,
      ...filter,
      favorites: (favoriteFilter !== undefined && favorite) || undefined,
      tags: params.tag
        ? { value: [params.tag], modifier: CriterionModifier.INCLUDES }
        : undefined,
    },
  });

  if (!loading && !data) return <ErrorMessage error="Failed to load scenes." />;

  const filters = (
    <>
      <TagFilter tag={params.tag} onChange={(t) => setParams("tag", t?.id)} />
      <InputGroup className="scene-sort w-auto">
        <Form.Select
          className="w-auto"
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
              "dir",
              direction === SortDirectionEnum.DESC
                ? SortDirectionEnum.ASC
                : SortDirectionEnum.DESC
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
      {favoriteFilter === "performer" || favoriteFilter === "studio" ? (
        <Form.Group controlId="favorite" className="ms-3">
          <Form.Check
            className="mt-2"
            type="switch"
            label={`Only favorite ${favoriteFilter}s`}
            defaultChecked={!!favorite}
            onChange={(e) =>
              setParams(
                "favorite",
                e.currentTarget.checked ? favoriteFilter.toUpperCase() : "NONE"
              )
            }
          />
        </Form.Group>
      ) : favoriteFilter === "all" ? (
        <Select
          className="FavoriteFilter ms-4"
          classNamePrefix="react-select"
          onChange={(val) => setParams("favorite", val ? val.value : "NONE")}
          placeholder="Favorite filter"
          isClearable
          options={[
            {
              label: "All Favorites",
              value: FavoriteFilter.ALL,
            },
            {
              label: "Favorite Performers",
              value: FavoriteFilter.PERFORMER,
            },
            {
              label: "Favorite Studios",
              value: FavoriteFilter.STUDIO,
            },
          ]}
        />
      ) : null}
    </>
  );

  const scenes = (data?.queryScenes.scenes ?? []).map((scene) => (
    <Col xs={3} key={scene.id}>
      <SceneCard scene={scene} />
    </Col>
  ));

  return (
    <List
      page={page}
      setPage={setPage}
      perPage={perPage}
      listCount={data?.queryScenes.count}
      loading={loading}
      filters={filters}
      entityName="scenes"
    >
      <Row>{scenes}</Row>
    </List>
  );
};

export default SceneList;
