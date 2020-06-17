import React, { useState, useRef } from "react";
import Creatable from "react-select/creatable";
import { ValueType, OptionTypeBase } from "react-select";

import { CloseButton } from "src/components/fragments";

interface IOptionType extends OptionTypeBase {
  value?: string;
  label?: string;
}

interface BodyModificationProps {
  name: string;
  options: string[];
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  register: any;
  locationPlaceholder: string;
  descriptionPlaceholder: string;
  defaultValues?: { location: string; description?: string | null }[];
}

const CLASSNAME = "BodyModification";

const BodyModification: React.FC<BodyModificationProps> = ({
  name,
  locationPlaceholder,
  descriptionPlaceholder,
  options,
  register,
  defaultValues,
}) => {
  const [modifications, setModifications] = useState(defaultValues || []);
  const selectRef = useRef(null);

  const handleChange = (newValue: ValueType<IOptionType>) => {
    const val = newValue as IOptionType;
    if (val?.value)
      setModifications([...modifications, { location: val.value }]);
  };

  const removeMod = (index: number) =>
    setModifications(modifications.filter((_, i) => i !== index));

  const modificationList = modifications.map((mod, index) => {
    const idx = `${name}[${index}]`;
    const inputName = `${idx}.description`;
    return (
      <div key={mod.location}>
        <CloseButton
          className={`${CLASSNAME}-remove`}
          handler={() => removeMod(index)}
        />
        <input
          type="hidden"
          name={`${idx}.location`}
          value={mod.location}
          ref={register}
        />
        <label htmlFor={inputName} className={`${CLASSNAME}-label`}>
          <span className={`${CLASSNAME}-location`}>{mod.location}</span>
          <input
            type="text"
            className="form-control"
            name={inputName}
            placeholder={descriptionPlaceholder}
            defaultValue={mod.description ?? ""}
            ref={register}
          />
        </label>
      </div>
    );
  });

  const opts = options.map((opt) => ({ label: opt, value: opt }));

  return (
    <div className={CLASSNAME}>
      <h6>{name}</h6>
      {modificationList}
        <Creatable
          classNamePrefix="react-select"
          value={null}
          ref={selectRef}
          name={name}
          options={opts}
          placeholder={locationPlaceholder}
          onChange={handleChange}
        />
    </div>
  );
};

export default BodyModification;
