import React from "react";
import Select from "react-select";
import { Controller } from "react-hook-form";

import { useStudios, SortDirectionEnum } from "src/graphql";

interface StudioSelectProps {
  initialStudio?: string;
  excludeStudio?: string;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  control: any;
  networkSelect?: boolean;
}

const CLASSNAME = "StudioSelect";
const CLASSNAME_SELECT = `${CLASSNAME}-select`;

const StudioSelect: React.FC<StudioSelectProps> = ({
  initialStudio,
  excludeStudio,
  control,
  networkSelect = false,
}) => {
  const { loading, data } = useStudios({
    studioFilter: { has_parent: networkSelect ? false : undefined },
    filter: { page: 0, per_page: 2000, direction: SortDirectionEnum.ASC },
  });

  if (loading) return <></>;
  if (!data) return <span>Failed to load studios.</span>;

  const options = data?.queryStudios?.studios
    .map((s) => ({
      value: s.id,
      label: s.name,
    }))
    .filter((s) => s.value !== excludeStudio);
  const defaultValue = options?.find((o) => o.value === initialStudio);

  return (
    <div className={CLASSNAME}>
      <Controller
        name="studio"
        control={control}
        render={({ onChange }) => (
          <Select
            classNamePrefix="react-select"
            className={`react-select ${CLASSNAME_SELECT}`}
            onChange={(s) => s && onChange(s.value)}
            options={options}
            defaultValue={defaultValue}
          />
        )}
      />
    </div>
  );
};

export default StudioSelect;
