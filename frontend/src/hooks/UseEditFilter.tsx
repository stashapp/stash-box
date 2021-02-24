import React from "react";
import { Form } from "react-bootstrap";
import { useHistory } from "react-router-dom";
import queryString from "query-string";

import { OperationEnum, TargetTypeEnum, VoteStatusEnum } from "src/graphql";
import {
  EditOperationTypes,
  EditTargetTypes,
  EditStatusTypes,
} from "src/constants/enums";

function resolveParam<T>(
  type: T,
  param: string | string[] | undefined | null
): T[keyof T] | undefined {
  if (!param) return;
  const strval = Array.isArray(param) ? param[0] : param;
  return type[strval.toUpperCase() as keyof T];
}

interface EditFilterProps {
  type?: TargetTypeEnum;
  status?: VoteStatusEnum;
  operation?: OperationEnum;
}

const useEditFilter = ({
  type: fixedType,
  status: fixedStatus,
  operation: fixedOperation,
}: EditFilterProps) => {
  const history = useHistory();
  const query = queryString.parse(history.location.search);
  const operation = resolveParam(OperationEnum, query.operation);
  const status = resolveParam(VoteStatusEnum, query.status);
  const type = resolveParam(TargetTypeEnum, query.type);
  const selectedStatus = fixedStatus ?? status;
  const selectedType = fixedType ?? type;
  const selectedOperation = fixedOperation ?? operation;

  const createQueryString = (
    updatedParams: Record<string, string | undefined>
  ) =>
    queryString
      .stringify({
        type: !type ? undefined : type,
        status: !status ? undefined : status,
        operation: !operation ? undefined : operation,
        ...updatedParams,
      })
      .toLowerCase();

  const handleChange = (key: string, e: React.ChangeEvent<HTMLSelectElement>) =>
    history.replace({
      ...history.location,
      search: createQueryString({
        [key]: !e.currentTarget.value ? undefined : e.currentTarget.value,
      }),
    });

  const enumToOptions = (e: Record<string, string>) =>
    Object.keys(e).map((key) => (
      <option key={key} value={key}>
        {e[key]}
      </option>
    ));

  const editFilter = (
    <Form className="d-flex align-items-center font-weight-bold mx-0">
      <Form.Group className="d-flex align-items-center">
        <Form.Label className="mr-4 mb-0">Type</Form.Label>
        <Form.Control
          as="select"
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            handleChange("type", e)
          }
          value={selectedType}
          disabled={!!fixedType}
        >
          <option value="" key="all-targets">
            All
          </option>
          {enumToOptions(EditTargetTypes)}
        </Form.Control>
      </Form.Group>
      <Form.Group className="d-flex align-items-center">
        <Form.Label className="mx-4 mb-0">Status</Form.Label>
        <Form.Control
          as="select"
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            handleChange("status", e)
          }
          value={selectedStatus}
          disabled={!!fixedStatus}
        >
          <option value="" key="all-statuses">
            All
          </option>
          {enumToOptions(EditStatusTypes)}
        </Form.Control>
      </Form.Group>
      <Form.Group className="d-flex align-items-center">
        <Form.Label className="mx-4 mb-0">Operation</Form.Label>
        <Form.Control
          as="select"
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            handleChange("operation", e)
          }
          value={selectedOperation}
          disabled={!!fixedOperation}
        >
          <option value="" key="all-operations">
            All
          </option>
          {enumToOptions(EditOperationTypes)}
        </Form.Control>
      </Form.Group>
    </Form>
  );

  return { editFilter, selectedType, selectedStatus, selectedOperation };
};

export default useEditFilter;
