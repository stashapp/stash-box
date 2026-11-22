import {
  faSortAmountDown,
  faSortAmountUp,
} from "@fortawesome/free-solid-svg-icons";
import type { FC } from "react";
import { Button, Col, Form, InputGroup, Row } from "react-bootstrap";
import { ErrorMessage, Icon } from "src/components/fragments";
import GalleryCard from "src/components/galleryCard";
import TagFilter from "src/components/tagFilter";
import {
  CriterionModifier,
  type GalleryQueryInput,
  GallerySortEnum,
  SortDirectionEnum,
  useGalleries,
  useGalleryCount,
} from "src/graphql";
import { usePagination, useQueryParams } from "src/hooks";
import { ensureEnum } from "src/utils";
import List from "./List";

const PER_PAGE = 20;

const sortOptions = [
  { value: GallerySortEnum.DATE, label: "Release Date" },
  { value: GallerySortEnum.TITLE, label: "Title" },
  { value: GallerySortEnum.CREATED_AT, label: "Created At" },
  { value: GallerySortEnum.UPDATED_AT, label: "Updated At" },
];

interface Props {
  filter?: Partial<GalleryQueryInput>;
  tagsFilter?: GalleryQueryInput["tags"];
  perPage?: number;
}

const GalleryList: FC<Props> = ({ filter, tagsFilter, perPage = PER_PAGE }) => {
  const [params, setParams] = useQueryParams({
    sort: { name: "sort", type: "string", default: GallerySortEnum.DATE },
    dir: { name: "dir", type: "string", default: SortDirectionEnum.DESC },
    tag: { name: "tag", type: "string" },
  });
  const sort = ensureEnum(GallerySortEnum, params.sort);
  const direction = ensureEnum(SortDirectionEnum, params.dir);
  const { page, setPage } = usePagination();

  const input: GalleryQueryInput = {
    page,
    per_page: perPage,
    sort,
    direction,
    ...filter,
    tags:
      tagsFilter ||
      (params.tag
        ? { value: [params.tag], modifier: CriterionModifier.INCLUDES }
        : undefined),
  };

  const { loading, data } = useGalleries({ input });
  const galleries = data?.queryGalleries.galleries;
  const derivedCount =
    galleries && galleries.length > 0 && galleries.length < perPage
      ? (page - 1) * perPage + galleries.length
      : undefined;
  const { data: countData } = useGalleryCount(
    { input: { ...input, page: 1 } },
    loading || derivedCount !== undefined,
  );
  const count = derivedCount ?? countData?.queryGalleries.count;

  if (!loading && !data)
    return <ErrorMessage error="Failed to load galleries." />;

  const filters = (
    <>
      {!tagsFilter && (
        <TagFilter
          tag={params.tag}
          onChange={(tag) => setParams("tag", tag?.id)}
        />
      )}
      <InputGroup className="w-auto">
        <Form.Select
          className="w-auto"
          onChange={(e) => setParams("sort", e.currentTarget.value)}
          defaultValue={sort}
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
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
                : SortDirectionEnum.DESC,
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
    </>
  );

  return (
    <List
      page={page}
      setPage={setPage}
      perPage={perPage}
      listCount={count}
      loading={loading}
      filters={filters}
      entityName="galleries"
    >
      <Row>
        {(galleries ?? []).map((gallery) => (
          <Col xs={3} key={gallery.id}>
            <GalleryCard gallery={gallery} />
          </Col>
        ))}
      </Row>
    </List>
  );
};

export default GalleryList;
