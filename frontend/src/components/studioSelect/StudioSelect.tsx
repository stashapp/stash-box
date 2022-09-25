import { FC } from "react";
import Async from "react-select/async";
import { useApolloClient } from "@apollo/client";
import debounce from "p-debounce";

import StudiosGQL from "src/graphql/queries/Studios.gql";
import StudioGQL from "src/graphql/queries/Studio.gql";

import {
  SortDirectionEnum,
  StudioSortEnum,
  StudiosQuery,
  StudiosQueryVariables,
  StudioQuery,
  StudioQueryVariables,
} from "src/graphql";
import { isUUID } from "src/utils";

type Studio = NonNullable<StudioQuery["findStudio"]>;
type StudioSlim = Pick<Studio, "id" | "name"> & Partial<Pick<Studio, "parent">>;

interface IOptionType {
  value: string;
  label: string;
  sublabel: string | undefined;
}

interface StudioSelectProps {
  initialStudio?: StudioSlim | null;
  excludeStudio?: string;
  onChange: (studio: StudioSlim | null) => void;
  onBlur?: React.FocusEventHandler;
  networkSelect?: boolean;
  isClearable?: boolean;
}

const CLASSNAME = "StudioSelect";
const CLASSNAME_SELECT = `${CLASSNAME}-select`;

const StudioSelect: FC<StudioSelectProps> = ({
  initialStudio,
  excludeStudio,
  onChange,
  onBlur,
  networkSelect = false,
  isClearable = false,
}) => {
  const client = useApolloClient();

  const fetchStudios = async (term: string): Promise<IOptionType[]> => {
    const value = term.trim();
    if (isUUID(value)) {
      if (value === excludeStudio) {
        return [];
      }

      const { data } = await client.query<StudioQuery, StudioQueryVariables>({
        query: StudioGQL,
        variables: { id: value },
      });

      const studio = data?.findStudio;
      if (!studio || (networkSelect && studio.parent !== null)) {
        return [];
      }

      return [
        {
          value: studio.id,
          label: studio.name,
          sublabel: studio.parent?.name,
        },
      ];
    }

    const { data } = await client.query<StudiosQuery, StudiosQueryVariables>({
      query: StudiosGQL,
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
        sublabel: s.parent?.name,
      }))
      .filter((s) => s.value !== excludeStudio);
  };

  const debouncedLoad = debounce(fetchStudios, 200);

  const defaultValue = initialStudio
    ? {
        value: initialStudio.id,
        label: initialStudio.name,
        sublabel: initialStudio.parent?.name,
      }
    : undefined;

  const formatStudioName = (opt: IOptionType) => (
    <>
      <span>{opt.label}</span>
      {opt.sublabel && (
        <small className="bullet-separator parent-studio">{opt.sublabel}</small>
      )}
    </>
  );

  return (
    <div className={CLASSNAME}>
      <Async
        classNamePrefix="react-select"
        className={`react-select ${CLASSNAME_SELECT}`}
        onChange={(s) => onChange(s ? { id: s.value, name: s.label } : null)}
        onBlur={onBlur}
        defaultValue={defaultValue}
        loadOptions={debouncedLoad}
        placeholder="Search for studio"
        noOptionsMessage={({ inputValue }) =>
          inputValue === "" ? null : `No studios found for "${inputValue}"`
        }
        isClearable={isClearable}
        formatOptionLabel={formatStudioName}
      />
    </div>
  );
};

export default StudioSelect;
