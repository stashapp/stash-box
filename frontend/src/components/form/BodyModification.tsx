import React from "react";
import Creatable from "react-select/creatable";
import { components } from "react-select";
import { Button, Form, InputGroup } from "react-bootstrap";
import { Control, useFieldArray } from "react-hook-form";

interface BodyModificationProps {
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  locationPlaceholder: string;
  descriptionPlaceholder: string;
  formatLabel: (text: string) => string;
}

type BodyModificationFieldArray = {
  [name: string]: Array<{
    location: string;
    description?: string | null;
  }>;
};

const CLASSNAME = "BodyModification";

const BodyModification: React.FC<BodyModificationProps> = ({
  name,
  locationPlaceholder,
  descriptionPlaceholder,
  control,
  formatLabel,
}) => {
  const {
    fields: modifications,
    append,
    remove,
    update,
  } = useFieldArray<BodyModificationFieldArray, string, "location">({
    control,
    name,
    keyName: "location",
  });
  const isNewLocationValid = (inputValue: string): boolean =>
    !!inputValue &&
    !modifications.find(({ location }) => inputValue === location);

  const handleNewLocation = (inputValue: string) => {
    append({ location: inputValue });
  };

  const modificationList = modifications.map((mod, index) => (
    <Form.Row key={mod.location} className="mb-1">
      <InputGroup className="col">
        <InputGroup.Prepend>
          <InputGroup.Text className="font-weight-bold">
            Location
          </InputGroup.Text>
        </InputGroup.Prepend>
        <Form.Control defaultValue={mod.location} readOnly />
        <Form.Control
          defaultValue={mod.description ?? ""}
          placeholder={descriptionPlaceholder}
          onInput={(e: React.ChangeEvent<HTMLInputElement>) =>
            update(index, { ...mod, description: e.currentTarget.value })
          }
        />
        <InputGroup.Append>
          <Button variant="danger" onClick={() => remove(index)}>
            Remove
          </Button>
        </InputGroup.Append>
      </InputGroup>
    </Form.Row>
  ));

  return (
    <>
      <Form.Row className={CLASSNAME}>
        <Form.Group className="col">
          <Form.Label className="text-capitalize">{name}</Form.Label>
          <Creatable
            classNamePrefix="react-select"
            value={null}
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
