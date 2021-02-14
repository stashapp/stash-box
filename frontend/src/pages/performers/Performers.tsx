import React, { useContext } from "react";
import { useQuery } from "@apollo/client";
import { loader } from "graphql.macro";
import { Link } from "react-router-dom";
import { Button, Col, Row } from "react-bootstrap";

import { Performers, PerformersVariables } from "src/definitions/Performers";
import { SortDirectionEnum } from "src/definitions/globalTypes";

import { usePagination } from "src/hooks";
import { ErrorMessage } from "src/components/fragments";
import PerformerCard from "src/components/performerCard";
import { canEdit } from "src/utils";
import AuthContext from "src/AuthContext";
import { List } from "src/components/list";

const PerformersQuery = loader("src/queries/Performers.gql");

const PER_PAGE = 20;

const PerformersComponent: React.FC = () => {
  const auth = useContext(AuthContext);
  const { page, setPage } = usePagination();
  const { loading, data } = useQuery<Performers, PerformersVariables>(
    PerformersQuery,
    {
      variables: {
        filter: {
          page,
          per_page: PER_PAGE,
          sort: "BIRTHDATE",
          direction: SortDirectionEnum.DESC,
        },
      },
    }
  );

  if (!loading && !data)
    return <ErrorMessage error="Failed to load performers" />;

  const performers = (data?.queryPerformers.performers ?? []).map(
    (performer) => (
      <Col xs={3} key={performer.id}>
        <PerformerCard performer={performer} />
      </Col>
    )
  );

  return (
    <>
      <div className="d-flex">
        <h3 className="mr-4">Performers</h3>
        {canEdit(auth.user) && (
          <Link to="/performers/add" className="ml-auto">
            <Button>Create</Button>
          </Link>
        )}
      </div>
      <List
        entityName="performers"
        page={page}
        setPage={setPage}
        loading={loading}
        listCount={data?.queryPerformers.count}
      >
        <Row>{performers}</Row>
      </List>
    </>
  );
};

export default PerformersComponent;
