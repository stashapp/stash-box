import {
  faSortAmountDown,
  faSortAmountUp,
} from "@fortawesome/free-solid-svg-icons";
import type { FC } from "react";
import { Button, Form, InputGroup } from "react-bootstrap";
import { Icon } from "src/components/fragments";
import { PerformerSortEnum, SortDirectionEnum } from "src/graphql";

const sortOptions = [
  { value: PerformerSortEnum.NAME, label: "Name" },
  { value: PerformerSortEnum.BIRTHDATE, label: "Birthdate" },
  { value: PerformerSortEnum.SCENE_COUNT, label: "Scene Count" },
  { value: PerformerSortEnum.CAREER_START_YEAR, label: "Career Start" },
  { value: PerformerSortEnum.DEBUT, label: "Scene Debut" },
  { value: PerformerSortEnum.LAST_SCENE, label: "Latest Scene" },
  { value: PerformerSortEnum.POPULARITY, label: "Popularity" },
  { value: PerformerSortEnum.CREATED_AT, label: "Created At" },
  { value: PerformerSortEnum.UPDATED_AT, label: "Updated At" },
];

interface PerformerSortProps {
  sort: PerformerSortEnum;
  direction: SortDirectionEnum;
  onSortChange: (sort: PerformerSortEnum) => void;
  onDirectionChange: (direction: SortDirectionEnum) => void;
}

const PerformerSort: FC<PerformerSortProps> = ({
  sort,
  direction,
  onSortChange,
  onDirectionChange,
}) => (
  <InputGroup className="performer-sort ms-2 me-3">
    <Form.Select
      aria-label="Sort performers"
      value={sort}
      onChange={(event) =>
        onSortChange(event.currentTarget.value as PerformerSortEnum)
      }
    >
      {sortOptions.map((option) => (
        <option value={option.value} key={option.value}>
          {option.label}
        </option>
      ))}
    </Form.Select>
    <Button
      variant="secondary"
      aria-label={`Sort ${direction === SortDirectionEnum.ASC ? "descending" : "ascending"}`}
      onClick={() =>
        onDirectionChange(
          direction === SortDirectionEnum.ASC
            ? SortDirectionEnum.DESC
            : SortDirectionEnum.ASC,
        )
      }
    >
      <Icon
        icon={
          direction === SortDirectionEnum.DESC
            ? faSortAmountDown
            : faSortAmountUp
        }
      />
    </Button>
  </InputGroup>
);

export default PerformerSort;
