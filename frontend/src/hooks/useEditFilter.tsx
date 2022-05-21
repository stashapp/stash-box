import { Button, Form, InputGroup } from "react-bootstrap";
import {
  faSortAmountUp,
  faSortAmountDown,
} from "@fortawesome/free-solid-svg-icons";

import {
  OperationEnum,
  SortDirectionEnum,
  TargetTypeEnum,
  VoteStatusEnum,
  EditSortEnum,
} from "src/graphql";
import {
  EditOperationTypes,
  EditTargetTypes,
  EditStatusTypes,
} from "src/constants/enums";
import { Icon } from "src/components/fragments";
import { useQueryParams } from "src/hooks";
import { resolveEnum, ensureEnum } from "src/utils";

const sortOptions = [
  { value: EditSortEnum.CREATED_AT, label: "Date created" },
  { value: EditSortEnum.CLOSED_AT, label: "Date closed" },
  { value: EditSortEnum.UPDATED_AT, label: "Date updated" },
];

interface EditFilterProps {
  sort?: EditSortEnum;
  direction?: SortDirectionEnum;
  type?: TargetTypeEnum;
  status?: VoteStatusEnum;
  operation?: OperationEnum;
  favorite?: boolean;
  showFavoriteOption?: boolean;
}

const useEditFilter = ({
  sort: fixedSort,
  direction: fixedDirection,
  type: fixedType,
  status: fixedStatus,
  operation: fixedOperation,
  favorite: fixedFavorite,
  showFavoriteOption = true,
}: EditFilterProps) => {
  const [params, setParams] = useQueryParams({
    query: { name: "query", type: "string", default: "" },
    sort: { name: "sort", type: "string", default: EditSortEnum.CREATED_AT },
    direction: { name: "dir", type: "string", default: SortDirectionEnum.DESC },
    operation: { name: "operation", type: "string", default: "" },
    status: { name: "status", type: "string", default: VoteStatusEnum.PENDING },
    type: { name: "type", type: "string", default: "" },
    favorite: { name: "favorite", type: "string", default: "false" },
  });

  const sort = ensureEnum(EditSortEnum, params.sort);
  const direction = ensureEnum(SortDirectionEnum, params.direction);
  const operation = resolveEnum(OperationEnum, params.operation);
  const status = resolveEnum(VoteStatusEnum, params.status, undefined);
  const type = resolveEnum(TargetTypeEnum, params.type);
  const favorite = params.favorite === "true";

  const selectedSort = fixedSort ?? sort;
  const selectedDirection = fixedDirection ?? direction;
  const selectedStatus = fixedStatus ?? status;
  const selectedType = fixedType ?? type;
  const selectedOperation = fixedOperation ?? operation;
  const selectedFavorite = fixedFavorite ?? favorite;

  const enumToOptions = (e: Record<string, string>) =>
    Object.keys(e).map((key) => (
      <option key={key} value={key}>
        {e[key]}
      </option>
    ));

  const editFilter = (
    <Form className="d-flex fw-bold mx-0">
      <Form.Group className="me-2 mb-3 d-flex flex-column">
        <Form.Label>Order</Form.Label>
        <InputGroup>
          <Form.Select
            onChange={(e) => setParams("sort", e.currentTarget.value)}
            defaultValue={selectedSort}
          >
            {sortOptions.map((s) => (
              <option value={s.value} key={s.value}>
                {s.label}
              </option>
            ))}
          </Form.Select>
          <Button
            variant="secondary"
            onClick={() =>
              setParams(
                "direction",
                selectedDirection === SortDirectionEnum.DESC
                  ? SortDirectionEnum.ASC
                  : SortDirectionEnum.DESC
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
        </InputGroup>
      </Form.Group>
      <Form.Group className="mx-2 mb-3 d-flex flex-column">
        <Form.Label>Type</Form.Label>
        <Form.Select
          onChange={(e) => setParams("type", e.currentTarget.value)}
          value={selectedType}
          disabled={!!fixedType}
        >
          <option value={""} key="all-targets">
            All
          </option>
          {enumToOptions(EditTargetTypes)}
        </Form.Select>
      </Form.Group>
      <Form.Group className="mx-2 mb-3 d-flex flex-column">
        <Form.Label>Status</Form.Label>
        <Form.Select
          onChange={(e) => setParams("status", e.currentTarget.value)}
          value={selectedStatus}
          disabled={!!fixedStatus}
        >
          <option value="all" key="all-statuses">
            All
          </option>
          {enumToOptions(EditStatusTypes)}
        </Form.Select>
      </Form.Group>
      <Form.Group className="mx-2 mb-3 d-flex flex-column">
        <Form.Label>Operation</Form.Label>
        <Form.Select
          onChange={(e) => setParams("operation", e.currentTarget.value)}
          value={selectedOperation}
          disabled={!!fixedOperation}
        >
          <option value="" key="all-operations">
            All
          </option>
          {enumToOptions(EditOperationTypes)}
        </Form.Select>
      </Form.Group>
      {showFavoriteOption && (
        <Form.Group controlId="favorite">
          <Form.Label>Favorites</Form.Label>
          <Form.Check
            className="ms-3 mt-2"
            type="switch"
            defaultChecked={favorite}
            onChange={(e) =>
              setParams("favorite", e.currentTarget.checked.toString())
            }
          />
        </Form.Group>
      )}
    </Form>
  );

  return {
    editFilter,
    selectedSort,
    selectedDirection,
    selectedType,
    selectedStatus,
    selectedOperation,
    selectedFavorite,
  };
};

export default useEditFilter;
