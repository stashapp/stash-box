import { FC } from "react";
import Async from "react-select/async";
import { Controller } from "react-hook-form";
import { useApolloClient } from "@apollo/client";
import debounce from "p-debounce";

import StudiosQuery from "src/graphql/queries/Studios.gql";
import StudioQuery from "src/graphql/queries/Studio.gql";

import { Studio_findStudio, Studio, StudioVariables } from "src/graphql/definitions/Studio";
import { Studios, StudiosVariables } from "src/graphql/definitions/Studios";
import { SortDirectionEnum } from "src/graphql";
import { isUUID } from "src/utils";

interface StudioSelectProps {
  initialStudio?: Pick<Studio_findStudio, "id" | "name"> | null;
  excludeStudio?: string;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  control: any;
  networkSelect?: boolean;
  isClearable?: boolean;
}

const CLASSNAME = "StudioSelect";
const CLASSNAME_SELECT = `${CLASSNAME}-select`;

const StudioSelect: FC<StudioSelectProps> = ({
  initialStudio,
  excludeStudio,
  control,
  networkSelect = false,
  isClearable = false,
}) => {
  const client = useApolloClient();

  const fetchStudios = async (term: string) => {
    if (isUUID(term)) {
      if (term === excludeStudio) {
        return [];
      }

      const { data } = await client.query<Studio, StudioVariables>({
        query: StudioQuery,
        variables: { id: term },
      });

      const studio = data?.findStudio;
      if (!studio) {
        return [];
      }

      return [{ value: studio.id, label: studio.name }];
    }

    const { data } = await client.query<Studios, StudiosVariables>({
      query: StudiosQuery,
      variables: {
        studioFilter: {
          name: term,
          has_parent: networkSelect ? false : undefined,
        },
        filter: { page: 0, per_page: 2000, direction: SortDirectionEnum.ASC },
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
      <Controller
        name="studio"
        control={control}
        defaultValue={initialStudio?.id ?? null}
        render={({ field: { onChange } }) => (
          <Async
            classNamePrefix="react-select"
            className={`react-select ${CLASSNAME_SELECT}`}
            onChange={(s) => onChange({ id: s?.value, name: s?.label })}
            defaultValue={defaultValue}
            loadOptions={debouncedLoad}
            placeholder="Search for studio"
            noOptionsMessage={({ inputValue }) =>
              inputValue === "" ? null : `No studios found for "${inputValue}"`
            }
            isClearable={isClearable}
          />
        )}
      />
    </div>
  );
};

export default StudioSelect;
