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
import {
  EditSortEnum,
  OperationEnum,
  SortDirectionEnum,
  TargetTypeEnum,
  UserVotedFilterEnum,
  VoteStatusEnum,
} from "src/graphql";
import { useFilterSearch, useUpdateSearch } from "src/hooks/useUpdateSearch";
import { searchEnum } from "src/routing/search";
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
  const params = useFilterSearch();
  const updateSearch = useUpdateSearch();

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
  } = editFilterValues(params, {
    sort: fixedSort,
    direction: fixedDirection,
    status: fixedStatus,
    type: fixedType,
    operation: fixedOperation,
    voted: fixedVoted,
    favorite: fixedFavorite,
    bot: fixedBot,
    userSubmitted: fixedUserSubmitted,
    defaultVoteStatus,
    defaultVoted,
    defaultBot,
    defaultUserSubmitted,
  });

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
            onChange={(e) =>
              updateSearch({
                sort: searchEnum(EditSortEnum, e.currentTarget.value),
              })
            }
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
              updateSearch({
                dir:
                  selectedDirection === SortDirectionEnum.DESC
                    ? SortDirectionEnum.ASC
                    : SortDirectionEnum.DESC,
              })
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
          onChange={(e) =>
            updateSearch({
              type: searchEnum(TargetTypeEnum, e.currentTarget.value),
            })
          }
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
          onChange={(e) =>
            updateSearch({
              status: searchEnum(
                { ...VoteStatusEnum, ALL: "all" },
                e.currentTarget.value,
              ),
            })
          }
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
          onChange={(e) =>
            updateSearch({
              operation: searchEnum(OperationEnum, e.currentTarget.value),
            })
          }
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
            onChange={(e) =>
              updateSearch({
                voted: searchEnum(
                  { ...UserVotedFilterEnum, ALL: "all" },
                  e.currentTarget.value,
                ),
              })
            }
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
              updateSearch({ favorite: e.currentTarget.checked })
            }
          />
        </Form.Group>
      )}
      <Form.Group controlId="bot" className="text-center ms-3">
        <Form.Label>Bot Edits</Form.Label>
        <Select
          className="BotFilter"
          classNamePrefix="react-select"
          onChange={(option) =>
            updateSearch({
              bot: searchEnum(
                { INCLUDE: "include", EXCLUDE: "exclude", ONLY: "only" },
                option?.value,
              ),
            })
          }
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
              updateSearch({ user_submitted: e.currentTarget.checked })
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
