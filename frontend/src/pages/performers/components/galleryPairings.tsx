import { type FC, Fragment } from "react";
import { Col, Row } from "react-bootstrap";
import { List } from "src/components/list";
import PerformerCard from "src/components/performerCard";
import {
  GenderFilterEnum,
  PerformerSortEnum,
  SortDirectionEnum,
  useGalleryPairings,
} from "src/graphql";
import { usePagination, useQueryParams } from "src/hooks";
import { ensureEnum, resolveEnum } from "src/utils";
import { GalleryPairingRow } from "./galleryPairingRow";
import { PairingFilters } from "./pairingFilters";

const PER_PAGE = 25;
const GALLERIES_PER_PAGE = 12;

const sortOptions = [
  { value: PerformerSortEnum.NAME, label: "Name" },
  {
    value: PerformerSortEnum.SHARED_GALLERY_COUNT,
    label: "Galleries Together",
  },
  { value: PerformerSortEnum.BIRTHDATE, label: "Birthdate" },
  { value: PerformerSortEnum.GALLERY_COUNT, label: "Gallery Count" },
  { value: PerformerSortEnum.CAREER_START_YEAR, label: "Career Start" },
  { value: PerformerSortEnum.CREATED_AT, label: "Created At" },
];

export const GalleryPairings: FC<{ id: string }> = ({ id }) => {
  const [params, setParams] = useQueryParams({
    query: { name: "query", type: "string", default: "" },
    gender: { name: "gender", type: "string" },
    direction: { name: "dir", type: "string", default: SortDirectionEnum.DESC },
    sort: {
      name: "sort",
      type: "string",
      default: PerformerSortEnum.SHARED_GALLERY_COUNT,
    },
    favorite: { name: "favorite", type: "string", default: "false" },
    galleries: { name: "galleries", type: "string", default: "false" },
  });
  const gender = resolveEnum(GenderFilterEnum, params.gender);
  const direction = ensureEnum(SortDirectionEnum, params.direction);
  const sort = ensureEnum(PerformerSortEnum, params.sort);
  const favorite = params.favorite === "true" || undefined;
  const fetchGalleries = params.galleries === "true";
  const { page, setPage } = usePagination();
  const { data, loading } = useGalleryPairings({
    performerId: id,
    names: params.query,
    gender,
    favorite,
    page,
    per_page: PER_PAGE,
    sort,
    direction,
    fetchGalleries,
    galleriesPerPage: GALLERIES_PER_PAGE,
  });
  const performers = data?.queryPerformers.performers;
  const filters = (
    <PairingFilters
      query={params.query}
      gender={gender}
      direction={direction}
      sort={sort}
      favorite={favorite}
      fetchItems={fetchGalleries}
      itemParam="galleries"
      itemLabel="Galleries"
      idPrefix="gallery-pairing"
      sortOptions={sortOptions}
      setParam={setParams}
    />
  );

  return (
    <List
      entityName="Gallery Pairings"
      page={page}
      filters={filters}
      setPage={setPage}
      perPage={PER_PAGE}
      loading={loading}
      listCount={data?.queryPerformers.count}
    >
      {fetchGalleries ? (
        performers?.map((performer, index) => (
          <Fragment key={performer.id}>
            <GalleryPairingRow
              performerId={id}
              partner={performer}
              galleryCount={performer.queryGalleries.count}
              firstPage={performer.queryGalleries.galleries ?? []}
              perPage={GALLERIES_PER_PAGE}
            />
            {index < performers.length - 1 && <hr />}
          </Fragment>
        ))
      ) : (
        <Row>
          {performers?.map((performer) => (
            <Col xs={3} key={performer.id}>
              <PerformerCard performer={performer} />
              <div className="text-center text-muted mb-3">
                {performer.queryGalleries.count} galler
                {performer.queryGalleries.count === 1 ? "y" : "ies"} together
              </div>
            </Col>
          ))}
        </Row>
      )}
    </List>
  );
};
