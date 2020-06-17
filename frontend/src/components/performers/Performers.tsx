import React from "react";
import { useQuery } from "@apollo/react-hooks";
import { loader } from "graphql.macro";

import { Performers } from "src/definitions/Performers";

import { usePagination } from "src/hooks";
import Pagination from "src/components/pagination";
import { LoadingIndicator } from "src/components/fragments";
import PerformerCard from "src/components/performerCard";

const PerformersQuery = loader("src/queries/Performers.gql");

const PerformersComponent: React.FC = () => {
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
      <div className="row">
        <h3 className="col-4">Performers</h3>
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
