import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@apollo/react-hooks";
import { Button, Card } from "react-bootstrap";
import { loader } from "graphql.macro";

import { Tags } from "src/definitions/Tags";

import { LoadingIndicator } from "src/components/fragments";
import { canEdit } from "src/utils/auth";
import AuthContext from "src/AuthContext";

const TagsQuery = loader("src/queries/Tags.gql");

const TagsComponent: React.FC = () => {
  const auth = useContext(AuthContext);
  const { loading, data } = useQuery<Tags>(TagsQuery, {
    variables: { filter: { per_page: 10000, sort: "name", direction: "ASC" } },
  });

  if (loading) return <LoadingIndicator message="Loading tags..." />;

  const tags = (data?.queryTags?.tags ?? []).map((tag) => (
    <li key={tag.id}>
      <Link to={encodeURI(encodeURI(`/tags/${tag.name}`))}>{tag.name}</Link>
      <span className="ml-2">{tag.description}</span>
    </li>
  ));

  return (
    <>
      <div className="d-flex">
        <h3 className="mr-4">Tags</h3>
        {canEdit(auth.user) && (
          <Link to="/tags/add">
            <Button className="ml-auto">Create</Button>
          </Link>
        )}
      </div>
      <Card>
        <Card.Body className="pt-4" >
          <ul>{tags}</ul>
        </Card.Body>
      </Card>
    </>
  );
};

export default TagsComponent;
