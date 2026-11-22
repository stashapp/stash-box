import { type FC, Fragment } from "react";
import { Col, Row } from "react-bootstrap";
import { List } from "src/components/list";
import PerformerCard from "src/components/performerCard";
import {
  GenderFilterEnum,
  PerformerSortEnum,
  SortDirectionEnum,
  useScenePairings,
} from "src/graphql";
import { usePagination, useQueryParams } from "src/hooks";
import { ensureEnum, resolveEnum } from "src/utils";
import { PairingFilters } from "./pairingFilters";
import { PairingRow } from "./pairingRow";

const PER_PAGE = 25;
const SCENES_PER_PAGE = 12;

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
  const [params, setParams] = useQueryParams({
    query: { name: "query", type: "string", default: "" },
    gender: { name: "gender", type: "string" },
    direction: { name: "dir", type: "string", default: SortDirectionEnum.DESC },
    sort: {
      name: "sort",
      type: "string",
      default: PerformerSortEnum.SHARED_SCENE_COUNT,
    },
    favorite: { name: "favorite", type: "string", default: "false" },
    scenes: { name: "scenes", type: "string", default: "false" },
  });
  const gender = resolveEnum(GenderFilterEnum, params.gender);
  const direction = ensureEnum(SortDirectionEnum, params.direction);
  const sort = ensureEnum(PerformerSortEnum, params.sort);
  const favorite = params.favorite === "true" || undefined;
  const fetchScenes = params.scenes === "true";
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

  const filters = (
    <PairingFilters
      query={params.query}
      gender={gender}
      direction={direction}
      sort={sort}
      favorite={favorite}
      fetchItems={fetchScenes}
      itemParam="scenes"
      itemLabel="Scenes"
      idPrefix="scene-pairing"
      sortOptions={sortOptions}
      setParam={setParams}
    />
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
