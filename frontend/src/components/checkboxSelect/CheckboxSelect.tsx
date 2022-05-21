import { FC, useState } from "react";
import Select, { OnChangeValue } from "react-select";
import { Form } from "react-bootstrap";

interface MultiSelectProps {
  values: IOptionType[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  plural?: string;
  initialSelected?: string[];
}

interface IOptionType {
  label: string;
  value: string;
  subValues: string[] | null;
}

const CheckboxSelect: FC<MultiSelectProps> = ({
  values,
  onChange,
  placeholder = "Select...",
  plural = "values",
  initialSelected = [],
}) => {
  const [unselected, setUnselected] = useState<string[]>(initialSelected);

  const handleChange = (vals: OnChangeValue<IOptionType, true>) => {
    const selected = vals.map((v) => [v.value, ...(v.subValues ?? [])]).flat();

    setUnselected(selected);
    onChange(selected);
  };

  const formatLabel = (
    option: IOptionType,
    meta: { context: "menu" | "value" }
  ) => {
    if (meta.context === "menu")
      return option.subValues === null ? (
        <div className="d-flex ms-3">
          <Form.Check
            className="me-2"
            checked={unselected.includes(option.value)}
          />
          {option.label}
        </div>
      ) : (
        <div className="d-flex">
          <Form.Check
            className="me-2"
            checked={unselected.includes(option.value)}
          />
          <span className="text-muted">{option.label}</span>
        </div>
      );
    return `${
      unselected.length === 0 ? "All" : unselected.length
    } ${plural} selected`;
  };

  const defaultValue = values.filter((val) =>
    initialSelected.includes(val.value)
  );

  return (
    <Select
      defaultValue={defaultValue}
      isMulti
      classNamePrefix="react-select"
      className="react-select CheckboxSelect"
      options={values}
      onChange={handleChange}
      formatOptionLabel={formatLabel}
      hideSelectedOptions={false}
      closeMenuOnSelect={false}
      placeholder={placeholder}
      noOptionsMessage={() => null}
      styles={{
        option: (base) => ({
          ...base,
          backgroundColor: "transparent",
        }),
      }}
      components={{
        DropdownIndicator: () => null,
        IndicatorSeparator: () => null,
        MultiValue: (e) =>
          e.data.value === unselected[0] ? (
            <span className="text-secondary">
              {unselected.length} {plural} selected
            </span>
          ) : null,
      }}
    />
  );
};

export default CheckboxSelect;
