import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { Button, Card } from "react-bootstrap";
import { loader } from "graphql.macro";

import { Tags, TagsVariables } from "src/definitions/Tags";
import { SortDirectionEnum } from "src/definitions/globalTypes";

import { usePagination } from "src/hooks";
import Pagination from "src/components/pagination";
import { ErrorMessage, LoadingIndicator } from "src/components/fragments";
import { canEdit } from "src/utils/auth";
import AuthContext from "src/AuthContext";

const TagsQuery = loader("src/queries/Tags.gql");

const PER_PAGE = 40;

const TagsComponent: React.FC = () => {
  const auth = useContext(AuthContext);
  const [query, setQuery] = useState("");
  const { page, setPage } = usePagination();
  const { loading, data } = useQuery<Tags, TagsVariables>(TagsQuery, {
    variables: {
      filter: {
        page,
        per_page: PER_PAGE,
        sort: "name",
        direction: SortDirectionEnum.ASC,
      },
      tagFilter: {
        name: query,
      },
    },
  });

  if (loading) return <LoadingIndicator />;
  if (!data) return <ErrorMessage error="Failed to load tags." />;

  const tags = data.queryTags.tags.map((tag) => (
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

  return (
    <>
      <div className="d-flex">
        <h3 className="mr-4">Tags</h3>
        {canEdit(auth.user) && (
          <Link to="/tags/add">
            <Button className="ml-auto">Create</Button>
          </Link>
        )}
        <Pagination
          onClick={setPage}
          perPage={PER_PAGE}
          active={page}
          count={data.queryTags.count}
          showCount
        />
      </div>
      <Card>
        <Card.Body className="pt-4">
          <div className="row no-gutters justify-content-end">
            <label className="mr-4" htmlFor="tag-filter">
              <b className="mr-2">Filter name:</b>
              <input onChange={handleQuery} id="tag-filter" />
            </label>
          </div>
          {loading && <LoadingIndicator message="Loading tags..." />}
          {!loading && <ul>{tags}</ul>}
        </Card.Body>
      </Card>
      <div className="row no-gutters">
        <Pagination
          onClick={setPage}
          count={data.queryTags.count}
          perPage={PER_PAGE}
          active={page}
        />
      </div>
    </>
  );
};

export default TagsComponent;
