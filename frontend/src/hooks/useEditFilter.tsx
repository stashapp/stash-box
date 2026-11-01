import {
  faSortAmountDown,
  faSortAmountUp,
} from "@fortawesome/free-solid-svg-icons";
import { Button, Form, InputGroup } from "react-bootstrap";
import Select from "react-select";
import { Icon } from "src/components/fragments";
import {
  EditOperationTypes,
  EditStatusTypes,
  EditTargetTypes,
  UserVotedFilterTypes,
} from "src/constants/enums";
import { EditSortEnum, SortDirectionEnum } from "src/graphql";
import { useQueryParams } from "src/hooks";
import {
  type EditFilterOptions,
  editFilterValues,
} from "src/utils/listFilters";

const sortOptions = [
  { value: EditSortEnum.CREATED_AT, label: "Date created" },
  { value: EditSortEnum.CLOSED_AT, label: "Date closed" },
  { value: EditSortEnum.UPDATED_AT, label: "Date updated" },
];

const botOptions = [
  {
    label: "Include",
    value: "include",
  },
  {
    label: "Exclude",
    value: "exclude",
  },
  {
    label: "Only",
    value: "only",
  },
];

interface EditFilterProps extends EditFilterOptions {
  showFavoriteOption?: boolean;
  showVotedFilter?: boolean;
}

const useEditFilter = ({
  sort: fixedSort,
  direction: fixedDirection,
  type: fixedType,
  status: fixedStatus,
  operation: fixedOperation,
  voted: fixedVoted,
  favorite: fixedFavorite,
  bot: fixedBot,
  userSubmitted: fixedUserSubmitted,
  showFavoriteOption = true,
  showVotedFilter = true,
  defaultVoteStatus = "all",
  defaultVoted,
  defaultBot = "include",
  defaultUserSubmitted = true,
}: EditFilterProps) => {
  const [params, setParams] = useQueryParams({
    query: { name: "query", type: "string", default: "" },
    sort: { name: "sort", type: "string", default: EditSortEnum.CREATED_AT },
    direction: { name: "dir", type: "string", default: SortDirectionEnum.DESC },
    operation: { name: "operation", type: "string", default: "" },
    voted: {
      name: "voted",
      type: "string",
      default: defaultVoted,
    },
    status: { name: "status", type: "string", default: defaultVoteStatus },
    type: { name: "type", type: "string", default: "" },
    favorite: { name: "favorite", type: "string", default: "false" },
    bot: { name: "bot", type: "string", default: defaultBot },
    user_submitted: {
      name: "user_submitted",
      type: "string",
      default: defaultUserSubmitted.toString(),
    },
  });

  const {
    selectedSort,
    selectedDirection,
    selectedStatus,
    selectedType,
    selectedOperation,
    selectedVoted,
    selectedFavorite,
    selectedBot,
    selectedUserSubmitted,
  } = editFilterValues(
    { ...params, dir: params.direction },
    {
      sort: fixedSort,
      direction: fixedDirection,
      status: fixedStatus,
      type: fixedType,
      operation: fixedOperation,
      voted: fixedVoted,
      favorite: fixedFavorite,
      bot: fixedBot,
      userSubmitted: fixedUserSubmitted,
    },
  );

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
            aria-label="Edit order"
            onChange={(e) => setParams("sort", e.currentTarget.value)}
            value={selectedSort}
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
                  : SortDirectionEnum.DESC,
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
          value={selectedType ?? ""}
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
          value={selectedStatus ?? "all"}
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
          value={selectedOperation ?? ""}
          disabled={!!fixedOperation}
        >
          <option value="" key="all-operations">
            All
          </option>
          {enumToOptions(EditOperationTypes)}
        </Form.Select>
      </Form.Group>
      {showVotedFilter && (
        <Form.Group className="mx-2 mb-3 d-flex flex-column">
          <Form.Label>Voted</Form.Label>
          <Form.Select
            onChange={(e) => setParams("voted", e.currentTarget.value)}
            value={selectedVoted ?? "all"}
            disabled={!!fixedVoted}
          >
            <option value="all" key="all-voted">
              All
            </option>
            {enumToOptions(UserVotedFilterTypes)}
          </Form.Select>
        </Form.Group>
      )}
      {showFavoriteOption && (
        <Form.Group controlId="favorite" className="text-center">
          <Form.Label>Favorites</Form.Label>
          <Form.Check
            className="mt-2"
            type="switch"
            checked={selectedFavorite}
            onChange={(e) =>
              setParams("favorite", e.currentTarget.checked.toString())
            }
          />
        </Form.Group>
      )}
      <Form.Group controlId="bot" className="text-center ms-3">
        <Form.Label>Bot Edits</Form.Label>
        <Select
          className="BotFilter"
          classNamePrefix="react-select"
          onChange={(option) => setParams("bot", option?.value ?? "")}
          isClearable={false}
          components={{ IndicatorSeparator: null }}
          styles={{
            valueContainer: (props) => ({ ...props, fontWeight: 400 }),
          }}
          options={botOptions}
          value={botOptions.find((opt) => opt.value === selectedBot)}
        />
      </Form.Group>
      {fixedUserSubmitted === undefined && (
        <Form.Group
          controlId="include_user_submitted"
          className="text-center ms-3"
        >
          <Form.Label>My Edits</Form.Label>
          <Form.Check
            className="mt-2"
            type="switch"
            checked={selectedUserSubmitted}
            onChange={(e) =>
              setParams("user_submitted", e.currentTarget.checked.toString())
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
    selectedVoted,
    selectedFavorite,
    selectedBot,
    selectedUserSubmitted,
  };
};

export default useEditFilter;
