import React, { useContext } from "react";
import { useQuery } from "@apollo/client";
import { loader } from "graphql.macro";
import { Link } from "react-router-dom";
import { Button } from "react-bootstrap";

import { Performers } from "src/definitions/Performers";

import { usePagination } from "src/hooks";
import Pagination from "src/components/pagination";
import { ErrorMessage, LoadingIndicator } from "src/components/fragments";
import PerformerCard from "src/components/performerCard";
import { canEdit } from "src/utils";
import AuthContext from "src/AuthContext";

const PerformersQuery = loader("src/queries/Performers.gql");

const PER_PAGE = 20;

const PerformersComponent: React.FC = () => {
  const auth = useContext(AuthContext);
  const { page, setPage } = usePagination();
  const { loading: loadingData, data } = useQuery<Performers>(PerformersQuery, {
    variables: {
      filter: {
        page,
        per_page: PER_PAGE,
        sort: "BIRTHDATE",
        direction: "DESC",
      },
    },
  });

  if (loadingData) return <LoadingIndicator message="Loading performers..." />;
  if (!data) return <ErrorMessage error="Failed to load performers" />;

  const performers = data.queryPerformers.performers.map((performer) => (
    <PerformerCard performer={performer} />
  ));

  return (
    <>
      <div className="d-flex">
        <h3 className="mr-4">Performers</h3>
        {canEdit(auth.user) && (
          <Link to="/performers/add">
            <Button className="mr-auto">Create</Button>
          </Link>
        )}
        <Pagination
          onClick={setPage}
          perPage={PER_PAGE}
          count={data?.queryPerformers.count}
          active={page}
          showCount
        />
      </div>
      <div className="performers row">{performers}</div>
      <div className="row">
        <Pagination
          onClick={setPage}
          count={data.queryPerformers.count}
          perPage={PER_PAGE}
          active={page}
        />
      </div>
    </>
  );
};

export default PerformersComponent;
