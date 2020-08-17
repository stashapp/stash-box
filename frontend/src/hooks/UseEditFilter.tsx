import React from "react";
import { Form } from "react-bootstrap";
import { useHistory } from "react-router-dom";
import queryString from "query-string";

import {
  OperationEnum,
  TargetTypeEnum,
  VoteStatusEnum,
} from "src/definitions/globalTypes";

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
    history.push({
      ...history.location,
      search: createQueryString({
        [key]: !e.currentTarget.value ? undefined : e.currentTarget.value,
      }),
    });

  const enumToOptions = (e: Object) =>
    Object.keys(e).map((val) => (
      <option key={val} value={val}>
        {val}
      </option>
    ));

  const editFilter = (
    <Form className="row align-items-center font-weight-bold mx-0">
      <div className="col-4 d-flex align-items-center">
        <Form.Label className="mr-4">Type</Form.Label>
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
          {enumToOptions(TargetTypeEnum)}
        </Form.Control>
      </div>
      <div className="col-4 d-flex align-items-center">
        <Form.Label className="mr-4">Status</Form.Label>
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
          {enumToOptions(VoteStatusEnum)}
        </Form.Control>
      </div>
      <div className="col-4 d-flex align-items-center">
        <Form.Label className="mr-4">Operation</Form.Label>
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
          {enumToOptions(OperationEnum)}
        </Form.Control>
      </div>
    </Form>
  );

  return { editFilter, selectedType, selectedStatus, selectedOperation };
};

export default useEditFilter;
