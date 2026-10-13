import { useApolloClient } from "@apollo/client/react";
import debounce from "p-debounce";
import { type FC, useState } from "react";
import type { OnChangeValue } from "react-select";
import Async from "react-select/async";
import { SearchInput, TagLink } from "src/components/fragments";
import type {
  SearchScenesQuery,
  SearchScenesQueryVariables,
} from "src/graphql";
import SearchScenesGQL from "src/graphql/queries/SearchScenes.gql";
import { sceneHref } from "src/utils/route";

type Scene = NonNullable<SearchScenesQuery["searchScenes"]["scenes"][number]>;

export type SceneSlim = {
  id: string;
  title?: string | null;
  release_date?: string | null;
  deleted: boolean;
};

interface SceneSelectProps {
  scenes?: SceneSlim[];
  onChange: (scenes: SceneSlim[]) => void;
  message?: string;
  excludeScenes?: string[];
  inputId?: string;
}

interface SearchResult {
  value: Scene;
  label: string;
  sublabel: string;
}

const CLASSNAME = "SceneSelect";
const CLASSNAME_LIST = `${CLASSNAME}-list`;
const CLASSNAME_SELECT = `${CLASSNAME}-select`;
const CLASSNAME_CONTAINER = `${CLASSNAME}-container`;

const SceneSelect: FC<SceneSelectProps> = ({
  scenes: initialScenes = [],
  onChange,
  message = "Add scene:",
  excludeScenes = [],
  inputId,
}) => {
  const client = useApolloClient();
  const [scenes, setScenes] = useState(initialScenes);
  const excluded = [...excludeScenes, ...scenes.map((s) => s.id)];

  const handleChange = (result: OnChangeValue<SearchResult, false>) => {
    if (result?.value) {
      const { id, title, release_date, deleted } = result.value;
      const newScenes = [...scenes, { id, title, release_date, deleted }];
      setScenes(newScenes);
      onChange(newScenes);
    }
  };

  const removeScene = (id: string) => {
    const newScenes = scenes.filter((scene) => scene.id !== id);
    setScenes(newScenes);
    onChange(newScenes);
  };

  const sceneList = [...scenes]
    .sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""))
    .map((scene) => (
      <TagLink
        key={scene.id}
        title={scene.title ?? scene.id}
        description={scene.release_date}
        link={sceneHref(scene)}
        onRemove={() => removeScene(scene.id)}
        disabled
      />
    ));

  const handleSearch = async (term: string) => {
    const { data } = await client.query<
      SearchScenesQuery,
      SearchScenesQueryVariables
    >({
      query: SearchScenesGQL,
      variables: { term, per_page: 25 },
    });

    const results = (data?.searchScenes.scenes ?? [])
      .filter((scene) => !excluded.includes(scene.id) && !scene.deleted)
      .map((scene) => ({
        value: scene,
        label: scene.title ?? "",
        sublabel: [scene.release_date, scene.studio?.name]
          .filter(Boolean)
          .join(" \u2022 "),
      }));

    return results.length > 0 ? [{ label: "Scenes", options: results }] : [];
  };

  const debouncedLoadOptions = debounce(handleSearch, 400);

  const formatOptionLabel = ({ label, sublabel, value }: SearchResult) => (
    <div>
      <div className={`${CLASSNAME_SELECT}-value`}>
        {value.deleted ? <del>{label}</del> : label}
      </div>
      <div className={`${CLASSNAME_SELECT}-subvalue`}>{sublabel}</div>
    </div>
  );

  return (
    <div className={CLASSNAME}>
      <div className={CLASSNAME_LIST}>{sceneList}</div>
      <div className={CLASSNAME_CONTAINER}>
        <span>{message}</span>
        <Async
          isMulti={false}
          inputId={inputId}
          classNamePrefix="react-select"
          className={`react-select ${CLASSNAME_SELECT}`}
          onChange={handleChange}
          loadOptions={debouncedLoadOptions}
          placeholder="Search for scene"
          noOptionsMessage={({ inputValue }) =>
            inputValue === "" ? null : `No scenes found for "${inputValue}"`
          }
          controlShouldRenderValue={false}
          formatOptionLabel={formatOptionLabel}
          components={{ Input: SearchInput }}
        />
      </div>
    </div>
  );
};

export default SceneSelect;
