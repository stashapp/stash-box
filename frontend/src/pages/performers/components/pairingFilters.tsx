import {
  faSortAmountDown,
  faSortAmountUp,
} from "@fortawesome/free-solid-svg-icons";
import { Button, Form, InputGroup } from "react-bootstrap";
import Select from "react-select";
import { Icon } from "src/components/fragments";
import { GenderFilterTypes } from "src/constants";
import {
  GenderFilterEnum,
  PerformerSortEnum,
  SortDirectionEnum,
} from "src/graphql";
import { useDebouncedCallback } from "src/hooks";

const genderOptions = Object.entries(GenderFilterEnum).map(([, value]) => ({
  value,
  label: GenderFilterTypes[value],
}));

type CommonPairingParam =
  | "query"
  | "gender"
  | "direction"
  | "sort"
  | "favorite";

interface Props<K extends "scenes" | "galleries"> {
  query: string;
  gender: GenderFilterEnum | undefined;
  direction: SortDirectionEnum;
  sort: PerformerSortEnum | undefined;
  favorite: boolean | undefined;
  fetchItems: boolean;
  itemParam: K;
  itemLabel: string;
  idPrefix: string;
  sortOptions: { value: PerformerSortEnum; label: string }[];
  setParam: (key: CommonPairingParam | K, value?: string) => void;
}

export const PairingFilters = <K extends "scenes" | "galleries">({
  query,
  gender,
  direction,
  sort,
  favorite,
  fetchItems,
  itemParam,
  itemLabel,
  idPrefix,
  sortOptions,
  setParam,
}: Props<K>) => {
  const debouncedHandler = useDebouncedCallback(setParam, 200);

  return (
    <>
      <Form.Control
        id={`${idPrefix}-name`}
        onChange={(event) =>
          debouncedHandler("query", event.currentTarget.value)
        }
        placeholder="Filter performer name"
        defaultValue={query}
        className="w-auto"
      />
      <Select
        id={`${idPrefix}-gender`}
        options={genderOptions}
        defaultValue={genderOptions.find((option) => option.value === gender)}
        placeholder="Gender"
        isClearable
        onChange={(event) => setParam("gender", event?.value)}
        classNamePrefix="react-select"
        className="performer-filter ms-2"
      />
      <InputGroup className="performer-sort ms-2 me-3">
        <Form.Select
          onChange={(event) =>
            setParam("sort", event.currentTarget.value.toLowerCase())
          }
          defaultValue={sort ?? PerformerSortEnum.NAME}
        >
          {sortOptions.map((option) => (
            <option value={option.value} key={option.value}>
              {option.label}
            </option>
          ))}
        </Form.Select>
        <Button
          variant="secondary"
          onClick={() =>
            setParam(
              "direction",
              direction === SortDirectionEnum.DESC
                ? SortDirectionEnum.ASC
                : undefined,
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
      <Form.Group controlId={`${idPrefix}-favorite`}>
        <Form.Check
          className="mt-2"
          type="switch"
          label="Favorites"
          defaultChecked={favorite}
          onChange={(event) =>
            setParam("favorite", event.currentTarget.checked.toString())
          }
        />
      </Form.Group>
      <Form.Group controlId={`${idPrefix}-${itemParam}`}>
        <Form.Check
          className="mt-2 ms-2"
          type="switch"
          label={itemLabel}
          defaultChecked={fetchItems}
          onChange={(event) =>
            setParam(itemParam, event.currentTarget.checked.toString())
          }
        />
      </Form.Group>
    </>
  );
};
