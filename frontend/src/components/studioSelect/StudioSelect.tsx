import { FC } from "react";
import Async from "react-select/async";
import { useApolloClient } from "@apollo/client";
import debounce from "p-debounce";

import StudiosQuery from "src/graphql/queries/Studios.gql";
import StudioQuery from "src/graphql/queries/Studio.gql";

import {
  Studio_findStudio,
  Studio,
  StudioVariables,
} from "src/graphql/definitions/Studio";
import { Studios, StudiosVariables } from "src/graphql/definitions/Studios";
import { SortDirectionEnum, StudioSortEnum } from "src/graphql";
import { isUUID } from "src/utils";

type StudioSlim = Pick<Studio_findStudio, "id" | "name">;

interface StudioSelectProps {
  initialStudio?: StudioSlim | null;
  excludeStudio?: string;
  onChange: (studio: StudioSlim | null) => void;
  networkSelect?: boolean;
  isClearable?: boolean;
}

const CLASSNAME = "StudioSelect";
const CLASSNAME_SELECT = `${CLASSNAME}-select`;

const StudioSelect: FC<StudioSelectProps> = ({
  initialStudio,
  excludeStudio,
  onChange,
  networkSelect = false,
  isClearable = false,
}) => {
  const client = useApolloClient();

  const fetchStudios = async (term: string) => {
    const value = term.trim();
    if (isUUID(value)) {
      if (value === excludeStudio) {
        return [];
      }

      const { data } = await client.query<Studio, StudioVariables>({
        query: StudioQuery,
        variables: { id: value },
      });

      const studio = data?.findStudio;
      if (!studio || (networkSelect && studio.parent !== null)) {
        return [];
      }

      return [{ value: studio.id, label: studio.name }];
    }

    const { data } = await client.query<Studios, StudiosVariables>({
      query: StudiosQuery,
      variables: {
        input: {
          name: term,
          has_parent: networkSelect ? false : undefined,
          page: 1,
          per_page: 25,
          sort: StudioSortEnum.NAME,
          direction: SortDirectionEnum.ASC,
        },
      },
    });

    return data?.queryStudios?.studios
      .map((s) => ({
        value: s.id,
        label: s.name,
      }))
      .filter((s) => s.value !== excludeStudio);
  };

  const debouncedLoad = debounce(fetchStudios, 200);

  const defaultValue = initialStudio
    ? {
        value: initialStudio.id,
        label: initialStudio.name,
      }
    : undefined;

  return (
    <div className={CLASSNAME}>
      <Async
        classNamePrefix="react-select"
        className={`react-select ${CLASSNAME_SELECT}`}
        onChange={(s) => onChange(s ? { id: s.value, name: s.label } : null)}
        defaultValue={defaultValue}
        loadOptions={debouncedLoad}
        placeholder="Search for studio"
        noOptionsMessage={({ inputValue }) =>
          inputValue === "" ? null : `No studios found for "${inputValue}"`
        }
        isClearable={isClearable}
      />
    </div>
  );
};

export default StudioSelect;
