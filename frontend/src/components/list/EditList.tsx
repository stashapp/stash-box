import React from "react";
import { useQuery } from "@apollo/client";
import { loader } from "graphql.macro";

import { useEditFilter, usePagination } from "src/hooks";
import {
  TargetTypeEnum,
  SortDirectionEnum,
  VoteStatusEnum,
  OperationEnum,
} from "src/definitions/globalTypes";
import { Edits, EditsVariables } from "src/definitions/Edits";
import { ErrorMessage } from "src/components/fragments";
import EditCard from "src/components/editCard";
import List from "./List";

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

  if (!loading && !data) return <ErrorMessage error="Failed to load edits." />;

  const edits =
    data?.queryEdits?.edits.map((edit) => (
      <EditCard edit={edit} key={edit.id} />
    )) ?? [];

  return (
    <List
      entityName="edits"
      loading={loading}
      listCount={data?.queryEdits.count}
      filters={editFilter}
      page={page}
      setPage={setPage}
    >
      <div>{edits}</div>
    </List>
  );
};

export default EditListComponent;
