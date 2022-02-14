import { FC } from "react";
import { Link, useHistory } from "react-router-dom";
import { Card, Form, Row } from "react-bootstrap";
import { debounce } from "lodash-es";
import querystring from "query-string";

import {
  useTags,
  SortDirectionEnum,
  TagSortEnum,
  TagQueryInput,
} from "src/graphql";
import { usePagination } from "src/hooks";
import { ErrorMessage } from "src/components/fragments";
import { createHref, tagHref } from "src/utils/route";
import { ROUTE_CATEGORIES } from "src/constants/route";
import List from "./List";

const PER_PAGE = 40;

interface TagListProps {
  tagFilter: Partial<TagQueryInput>;
  showCategoryLink?: boolean;
}

const TagList: FC<TagListProps> = ({ tagFilter, showCategoryLink = false }) => {
  const history = useHistory();
  const queries = querystring.parse(history.location.search);
  const query = Array.isArray(queries.query) ? queries.query[0] : queries.query;
  const { page, setPage } = usePagination();
  const { loading, data } = useTags({
    input: {
      name: query,
      page,
      per_page: PER_PAGE,
      sort: TagSortEnum.NAME,
      direction: SortDirectionEnum.ASC,
      ...tagFilter,
    },
  });

  const tags = (data?.queryTags?.tags ?? []).map((tag) => (
    <li key={tag.id}>
      <Link to={tagHref(tag)}>{tag.name}</Link>
      {tag.description && (
        <span className="ms-2">
          &bull;
          <small className="ms-2">{tag.description}</small>
        </span>
      )}
    </li>
  ));

  const handleQuery = (q: string) => {
    const qs = querystring.stringify({
      ...querystring.parse(history.location.search),
      query: q || undefined,
      page: undefined,
    });
    history.replace(`${history.location.pathname}?${qs}`);
  };
  const debouncedHandler = debounce(handleQuery, 200);

  const filters = (
    <Form.Control
      id="tag-query"
      onChange={(e) => debouncedHandler(e.currentTarget.value)}
      placeholder="Filter tag name"
      defaultValue={query ?? ""}
      className="w-25"
    />
  );

  if (!loading && !data) return <ErrorMessage error="Failed to load tags." />;

  return (
    <List
      entityName="tags"
      page={page}
      setPage={setPage}
      perPage={PER_PAGE}
      filters={filters}
      loading={loading}
      listCount={data?.queryTags.count}
    >
      <Card>
        <Card.Body className="pt-4">
          <Row className="g-0">
            {showCategoryLink && (
              <Link to={createHref(ROUTE_CATEGORIES)} className="ms-2">
                <h5>List of Categories</h5>
              </Link>
            )}
          </Row>
          <ul>{tags}</ul>
        </Card.Body>
      </Card>
    </List>
  );
};

export default TagList;
