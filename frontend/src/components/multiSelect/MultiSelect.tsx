import { FC } from "react";
import CreatableSelect from "react-select/creatable";
import { OnChangeValue } from "react-select";

interface MultiSelectProps {
  initialValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

interface IOptionType {
  label: string;
  value: string;
}

const MultiSelect: FC<MultiSelectProps> = ({
  initialValues,
  onChange,
  placeholder = "Select...",
}) => {
  const options: IOptionType[] = (initialValues ?? []).map((value) => ({
    label: value,
    value,
  }));

  const handleChange = (values: OnChangeValue<IOptionType, true>) => {
    if (!values) {
      onChange([]);
      return;
    }

    onChange(values.map((v) => v.value));
  };

  /** Allow creating a new option with a different casing. */
  const isValidNewOption = (
    inputValue: string,
    selectValue: OnChangeValue<IOptionType, true>
  ): boolean =>
    !!inputValue &&
    !selectValue.some(
      ({ value }) => value.toLowerCase() === inputValue.toLowerCase()
    );

  return (
    <div>
      <CreatableSelect
        isMulti
        classNamePrefix="react-select"
        className="react-select"
        defaultValue={options}
        options={options}
        isValidNewOption={isValidNewOption}
        onChange={handleChange}
        placeholder={placeholder}
        noOptionsMessage={() => null}
        formatCreateLabel={(value: string) => `Add '${value}'`}
        components={{
          DropdownIndicator: () => null,
          IndicatorSeparator: () => null,
        }}
      />
    </div>
  );
};

export default MultiSelect;
