import React, { useState, useRef } from "react";
import Creatable from "react-select/creatable";
import { components } from "react-select";
import { Button, Form, InputGroup } from "react-bootstrap";
import { Controller } from "react-hook-form";

interface BodyModificationProps {
  name: string;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  control: any;
  locationPlaceholder: string;
  descriptionPlaceholder: string;
  defaultValues?: { location: string; description?: string | null }[];
  formatLabel: (text: string) => string;
}

const CLASSNAME = "BodyModification";

const BodyModification: React.FC<BodyModificationProps> = ({
  name,
  locationPlaceholder,
  descriptionPlaceholder,
  control,
  defaultValues,
  formatLabel,
}) => {
  const [modifications, setModifications] = useState(defaultValues || []);
  const selectRef = useRef(null);

  const isNewLocationValid = (inputValue: string): boolean =>
    !!inputValue &&
    !modifications.find(({ location }) => inputValue === location);

  const handleNewLocation = (inputValue: string) => {
    setModifications([...modifications, { location: inputValue }]);
  };

  const removeMod = (index: number) =>
    setModifications(modifications.filter((_, i) => i !== index));

  const modificationList = modifications.map((mod, index) => {
    const idx = `${name}[${index}]`;
    return (
      <Form.Row key={mod.location} className="mb-1">
        <InputGroup className="col">
          <InputGroup.Prepend>
            <InputGroup.Text className="font-weight-bold">
              Location
            </InputGroup.Text>
          </InputGroup.Prepend>
          <Controller
            as={<Form.Control />}
            name={`${idx}.location`}
            control={control}
            defaultValue={mod.location}
            disabled
          />
          <Controller
            as={<Form.Control />}
            name={`${idx}.description`}
            defaultValue={mod.description}
            placeholder={descriptionPlaceholder}
            control={control}
          />
          <InputGroup.Append>
            <Button variant="danger" onClick={() => removeMod(index)}>
              Remove
            </Button>
          </InputGroup.Append>
        </InputGroup>
      </Form.Row>
    );
  });

  return (
    <>
      <Form.Row className={CLASSNAME}>
        <Form.Group className="col">
          <Form.Label className="text-capitalize">{name}</Form.Label>
          <Creatable
            classNamePrefix="react-select"
            value={null}
            ref={selectRef}
            name={name}
            placeholder={locationPlaceholder}
            isValidNewOption={isNewLocationValid}
            onCreateOption={handleNewLocation}
            formatCreateLabel={formatLabel}
            components={{
              DropdownIndicator: () => null,
              Menu: (data) =>
                data.options.length > 0 ? <components.Menu {...data} /> : <></>,
            }}
          />
        </Form.Group>
      </Form.Row>
      {modificationList}
    </>
  );
};

export default BodyModification;
