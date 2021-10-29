import React from "react";
import { Button, Form, InputGroup } from "react-bootstrap";
import { useHistory } from "react-router-dom";
import queryString from "query-string";
import {
  faSortAmountUp,
  faSortAmountDown,
} from "@fortawesome/free-solid-svg-icons";

import {
  OperationEnum,
  SortDirectionEnum,
  TargetTypeEnum,
  VoteStatusEnum,
} from "src/graphql";
import {
  EditOperationTypes,
  EditTargetTypes,
  EditStatusTypes,
} from "src/constants/enums";
import { Icon } from "src/components/fragments";

function resolveParam<T>(
  type: T,
  param: string | string[] | undefined | null
): T[keyof T] | undefined {
  if (!param) return;
  const strval = Array.isArray(param) ? param[0] : param;
  return type[strval.toUpperCase() as keyof T];
}

const sortOptions = [
  { value: "", label: "Date created" },
  { value: "updated_at", label: "Date updated" },
  // { value: "comment_count", label: "Comment count" },
  // { value: "vote_count", label: "Vote count" },
];
const defaultSort = "created_at";

interface EditFilterProps {
  sort?: string;
  direction?: SortDirectionEnum;
  type?: TargetTypeEnum;
  status?: VoteStatusEnum;
  operation?: OperationEnum;
}

const useEditFilter = ({
  sort: fixedSort,
  direction: fixedDirection,
  type: fixedType,
  status: fixedStatus,
  operation: fixedOperation,
}: EditFilterProps) => {
  const history = useHistory();
  const query = queryString.parse(history.location.search);
  const sort = Array.isArray(query.sort) ? query.sort[0] : query.sort;
  const direction =
    resolveParam(SortDirectionEnum, query.dir) ?? SortDirectionEnum.DESC;
  const operation = resolveParam(OperationEnum, query.operation);
  const status = resolveParam(VoteStatusEnum, query.status);
  const type = resolveParam(TargetTypeEnum, query.type);
  const selectedSort = fixedSort ?? sort;
  const selectedDirection = fixedDirection ?? direction;
  const selectedStatus = fixedStatus ?? status;
  const selectedType = fixedType ?? type;
  const selectedOperation = fixedOperation ?? operation;

  const createQueryString = (
    updatedParams: Record<string, string | undefined>
  ) =>
    queryString
      .stringify({
        sort: !sort ? undefined : sort,
        dir:
          !direction || direction === SortDirectionEnum.DESC
            ? undefined
            : direction,
        type: !type ? undefined : type,
        status: !status ? undefined : status,
        operation: !operation ? undefined : operation,
        ...updatedParams,
      })
      .toLowerCase();

  const handleChange = (key: string, value?: string) =>
    history.replace({
      ...history.location,
      search: createQueryString({
        [key]: !value ? undefined : value,
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
      <Form.Group className="mr-2 d-flex flex-column align-items-left">
        <Form.Label>Order</Form.Label>
        <div className="d-flex">
          <Form.Control
            as="select"
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              handleChange("sort", e.currentTarget.value)
            }
            defaultValue={selectedSort ?? defaultSort}
          >
            {sortOptions.map((s) => (
              <option value={s.value} key={s.value}>
                {s.label}
              </option>
            ))}
          </Form.Control>
          <InputGroup.Append>
            <Button
              variant="secondary"
              onClick={() =>
                handleChange(
                  "dir",
                  selectedDirection === SortDirectionEnum.DESC
                    ? SortDirectionEnum.ASC
                    : undefined
                )
              }
            >
              <Icon
                icon={
                  selectedDirection === SortDirectionEnum.ASC
                    ? faSortAmountUp
                    : faSortAmountDown
                }
              />
            </Button>
          </InputGroup.Append>
        </div>
      </Form.Group>
      <Form.Group className="mx-2 d-flex flex-column align-items-left">
        <Form.Label>Type</Form.Label>
        <Form.Control
          as="select"
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            handleChange("type", e.currentTarget.value)
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
      <Form.Group className="mx-2 d-flex flex-column align-items-left">
        <Form.Label>Status</Form.Label>
        <Form.Control
          as="select"
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            handleChange("status", e.currentTarget.value)
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
      <Form.Group className="mx-2 d-flex flex-column align-items-left">
        <Form.Label>Operation</Form.Label>
        <Form.Control
          as="select"
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            handleChange("operation", e.currentTarget.value)
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

  return {
    editFilter,
    selectedSort,
    selectedDirection,
    selectedType,
    selectedStatus,
    selectedOperation,
  };
};

export default useEditFilter;
