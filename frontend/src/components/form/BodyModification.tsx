import { FC, ChangeEvent } from "react";
import Creatable from "react-select/creatable";
import { components } from "react-select";
import { Button, Col, Form, InputGroup, Row } from "react-bootstrap";
import { useFieldArray } from "react-hook-form";
import type { Control } from "react-hook-form";

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

const BodyModification: FC<BodyModificationProps> = ({
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
  } = useFieldArray<BodyModificationFieldArray, string, "key">({
    control,
    name,
    keyName: "key",
  });
  const isNewLocationValid = (inputValue: string): boolean =>
    !!inputValue &&
    !modifications.find(({ location }) => inputValue === location);

  const handleNewLocation = (inputValue: string) => {
    append({ location: inputValue });
  };

  const modificationList = modifications.map((mod, index) => (
    <Row key={mod.location} className="mb-1">
      <InputGroup className="col">
        <InputGroup.Text className="fw-bold">Location</InputGroup.Text>
        <Form.Control defaultValue={mod.location} readOnly />
        <Form.Control
          defaultValue={mod.description ?? ""}
          placeholder={descriptionPlaceholder}
          onInput={(e: ChangeEvent<HTMLInputElement>) =>
            update(index, { ...mod, description: e.currentTarget.value })
          }
        />
        <Button variant="danger" onClick={() => remove(index)}>
          Remove
        </Button>
      </InputGroup>
    </Row>
  ));

  return (
    <>
      <Row className={CLASSNAME}>
        <Col className="mb-3">
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
        </Col>
      </Row>
      {modificationList}
    </>
  );
};

export default BodyModification;
