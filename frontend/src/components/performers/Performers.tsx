import React, { useContext } from "react";
import { useQuery } from "@apollo/client";
import { loader } from "graphql.macro";
import { Link } from "react-router-dom";
import { Button } from "react-bootstrap";

import { Performers } from "src/definitions/Performers";

import { usePagination } from "src/hooks";
import Pagination from "src/components/pagination";
import { LoadingIndicator } from "src/components/fragments";
import PerformerCard from "src/components/performerCard";
import { canEdit } from "src/utils/auth";
import AuthContext from "src/AuthContext";

const PerformersQuery = loader("src/queries/Performers.gql");

const PerformersComponent: React.FC = () => {
  const auth = useContext(AuthContext);
  const { page, setPage } = usePagination();
  const { loading: loadingData, data } = useQuery<Performers>(PerformersQuery, {
    variables: {
      filter: { page, per_page: 20, sort: "BIRTHDATE", direction: "DESC" },
    },
  });

  if (loadingData) return <LoadingIndicator message="Loading performers..." />;

  const totalPages = Math.ceil((data?.queryPerformers?.count ?? 0) / 20);

  const performers = (
    data?.queryPerformers?.performers ?? []
  ).map((performer) => <PerformerCard performer={performer} />);

  return (
    <>
      <div className="d-flex">
        <h3 className="mr-4">Performers</h3>
        {canEdit(auth.user) && (
          <Link to="/performers/add">
            <Button className="mr-auto">Create</Button>
          </Link>
        )}
        <Pagination onClick={setPage} pages={totalPages} active={page} />
      </div>
      <div className="performers row">{performers}</div>
      <div className="row">
        <Pagination onClick={setPage} pages={totalPages} active={page} />
      </div>
    </>
  );
};

export default PerformersComponent;
