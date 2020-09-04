import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { Button, Card } from "react-bootstrap";
import { loader } from "graphql.macro";

import { Tags, TagsVariables } from "src/definitions/Tags";
import { SortDirectionEnum, TagFilterType } from "src/definitions/globalTypes";

import { usePagination } from "src/hooks";
import Pagination from "src/components/pagination";
import { LoadingIndicator } from "src/components/fragments";
import { canEdit } from "src/utils/auth";
import AuthContext from "src/AuthContext";

const TagsQuery = loader("src/queries/Tags.gql");

const TAG_COUNT = 40;

interface TagListProps {
  tagFilter: TagFilterType;
  canCreate?: boolean;
  showCategoryLink?: boolean;
}

const TagList: React.FC<TagListProps> = ({
  tagFilter,
  canCreate = false,
  showCategoryLink = false,
}) => {
  const auth = useContext(AuthContext);
  const [query, setQuery] = useState("");
  const { page, setPage } = usePagination();
  const { loading, data } = useQuery<Tags, TagsVariables>(TagsQuery, {
    variables: {
      filter: {
        page,
        per_page: TAG_COUNT,
        sort: "name",
        direction: SortDirectionEnum.ASC,
      },
      tagFilter: {
        name: query,
        ...tagFilter,
      },
    },
  });

  const totalPages = Math.ceil((data?.queryTags?.count ?? 0) / TAG_COUNT);

  const tags = (data?.queryTags?.tags ?? []).map((tag) => (
    <li key={tag.id}>
      <Link to={encodeURI(encodeURI(`/tags/${tag.name}`))}>{tag.name}</Link>
      {tag.description && (
        <span className="ml-2">
          &bull;
          <small className="ml-2">{tag.description}</small>
        </span>
      )}
    </li>
  ));

  const handleQuery = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.currentTarget.value);
    setPage(1);
  };

  const isEmpty = tags.length === 0;

  return (
    <>
      <div className="d-flex">
        <h3 className="mr-4">Tags</h3>
        {canCreate && canEdit(auth.user) && (
          <Link to="/tags/add">
            <Button className="ml-auto">Create</Button>
          </Link>
        )}
        <Pagination
          onClick={setPage}
          pages={totalPages}
          active={page}
          count={data?.queryTags.count}
        />
      </div>
      <Card>
        <Card.Body className="pt-4">
          <div className="row no-gutters">
            {showCategoryLink && (
              <Link to="/categories" className="ml-4">
                <h5>List of Categories</h5>
              </Link>
            )}
            <label className="ml-auto mr-4" htmlFor="tag-filter">
              <b className="mr-2">Filter name:</b>
              <input onChange={handleQuery} id="tag-filter" />
            </label>
          </div>
          {loading && <LoadingIndicator message="Loading tags..." />}
          {!loading && <ul>{tags}</ul>}
          {!loading && isEmpty && (
            <h5 className="text-center m-4">No tags found</h5>
          )}
        </Card.Body>
      </Card>
      <div className="row no-gutters">
        <Pagination onClick={setPage} pages={totalPages} active={page} />
      </div>
    </>
  );
};

export default TagList;
