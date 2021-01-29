import React, { useState, useEffect } from "react";
import { useQuery } from "@apollo/client";
import { loader } from "graphql.macro";

import { useEditFilter, usePagination } from "src/hooks";
import Pagination from "src/components/pagination";
import {
  TargetTypeEnum,
  SortDirectionEnum,
  VoteStatusEnum,
  OperationEnum,
} from "src/definitions/globalTypes";
import { Edits, EditsVariables } from "src/definitions/Edits";
import { ErrorMessage, LoadingIndicator } from "src/components/fragments";
import EditCard from "src/components/editCard";

const EditsQuery = loader("src/queries/Edits.gql");

interface EditsProps {
  type?: TargetTypeEnum;
  id?: string;
  status?: VoteStatusEnum;
  operation?: OperationEnum;
}

const PER_PAGE = 20;

const EditListComponent: React.FC<EditsProps> = ({
  id,
  type,
  status,
  operation,
}) => {
  const [count, setCount] = useState(0);
  const { page, setPage } = usePagination();
  const {
    editFilter,
    selectedType,
    selectedOperation,
    selectedStatus,
  } = useEditFilter({
    type,
    status,
    operation,
  });
  const { data, loading } = useQuery<Edits, EditsVariables>(EditsQuery, {
    variables: {
      filter: {
        page,
        per_page: PER_PAGE,
        sort: "created_at",
        direction: SortDirectionEnum.DESC,
      },
      editFilter: {
        target_type: selectedType,
        target_id: id,
        status: selectedStatus,
        operation: selectedOperation,
      },
    },
  });
  useEffect(() => {
    if (!loading) setCount(data?.queryEdits.count ?? 0);
  }, [data, loading]);

  if (!loading && !data) return <ErrorMessage error="Failed to load edits." />;

  const edits =
    data?.queryEdits?.edits.map((edit) => (
      <EditCard edit={edit} key={edit.id} />
    )) ?? [];

  return (
    <>
      <div className="row no-gutters">
        <div className="col-8">{editFilter}</div>
        <div className="col-4 d-flex justify-content-end">
          <Pagination
            onClick={setPage}
            count={count}
            perPage={PER_PAGE}
            active={page}
            showCount
          />
        </div>
      </div>
      {loading ? (
        <LoadingIndicator message="Loading edits..." />
      ) : (
        <div>{edits}</div>
      )}
      <div className="row no-gutters">
        <Pagination
          onClick={setPage}
          perPage={PER_PAGE}
          count={count}
          active={page}
        />
      </div>
    </>
  );
};

export default EditListComponent;
