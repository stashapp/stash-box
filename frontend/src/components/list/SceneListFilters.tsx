import {
  faSortAmountDown,
  faSortAmountUp,
} from "@fortawesome/free-solid-svg-icons";
import { Button, Form, InputGroup } from "react-bootstrap";
import Select from "react-select";
import { Icon } from "src/components/fragments";
import TagFilter from "src/components/tagFilter";
import { FavoriteFilter, SceneSortEnum, SortDirectionEnum } from "src/graphql";
import { useFilterSearch, useUpdateSearch } from "src/hooks/useUpdateSearch";
import { searchEnum } from "src/routing/search";
import { type SceneListOptions, sceneListInput } from "src/utils/listFilters";

const sortOptions = [
  { value: SceneSortEnum.DATE, label: "Release Date" },
  { value: SceneSortEnum.TITLE, label: "Title" },
  { value: SceneSortEnum.TRENDING, label: "Trending" },
  { value: SceneSortEnum.POPULARITY, label: "Popularity" },
  { value: SceneSortEnum.CREATED_AT, label: "Created At" },
  { value: SceneSortEnum.UPDATED_AT, label: "Updated At" },
  { value: SceneSortEnum.DURATION, label: "Duration" },
];

const favoriteOptions = [
  {
    label: "All Favorites",
    value: FavoriteFilter.ALL,
  },
  {
    label: "Favorite Performers",
    value: FavoriteFilter.PERFORMER,
  },
  {
    label: "Favorite Studios",
    value: FavoriteFilter.STUDIO,
  },
];

export const SceneListFilters = ({
  favoriteFilter,
  tagsFilter,
}: Pick<SceneListOptions, "favoriteFilter" | "tagsFilter">) => {
  const params = useFilterSearch();
  const updateSearch = useUpdateSearch();
  const {
    sort,
    direction,
    favorites: favorite,
  } = sceneListInput(params, { favoriteFilter });

  const filters = (
    <>
      {!tagsFilter && (
        <TagFilter
          tag={params.tag ?? ""}
          onChange={(t) => updateSearch({ tag: t?.id })}
        />
      )}
      <InputGroup className="scene-sort w-auto">
        <Form.Select
          aria-label="Scene order"
          className="w-auto"
          onChange={(e) =>
            updateSearch({
              sort: searchEnum(SceneSortEnum, e.currentTarget.value),
            })
          }
          value={sort ?? SceneSortEnum.DATE}
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
                direction === SortDirectionEnum.DESC
                  ? SortDirectionEnum.ASC
                  : SortDirectionEnum.DESC,
            })
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
      {favoriteFilter === "performer" || favoriteFilter === "studio" ? (
        <Form.Group controlId="favorite" className="ms-3">
          <Form.Check
            className="mt-2"
            type="switch"
            label={`Only favorite ${favoriteFilter}s`}
            checked={!!favorite}
            onChange={(e) =>
              updateSearch({
                favorite: e.currentTarget.checked
                  ? searchEnum(FavoriteFilter, favoriteFilter)
                  : undefined,
              })
            }
          />
        </Form.Group>
      ) : favoriteFilter === "all" ? (
        <Select
          className="FavoriteFilter ms-4"
          classNamePrefix="react-select"
          onChange={(val) => updateSearch({ favorite: val?.value })}
          placeholder="Favorite filter"
          isClearable
          value={
            favorite
              ? favoriteOptions.find((fav) => fav.value === favorite)
              : undefined
          }
          options={favoriteOptions}
        />
      ) : null}
    </>
  );

  return filters;
};
