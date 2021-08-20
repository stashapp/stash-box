import React, { useEffect, useState } from "react";
import { Button, Col, Form, InputGroup } from "react-bootstrap";

import {
  ImportDataType,
  ImportFieldInput,
  RegexReplacementInput,
  SubmitImportInput,
  useImportScenes,
  useSubmitSceneImport,
} from "src/graphql";
import { Icon } from "src/components/fragments";
import { ROUTE_COMPLETE_IMPORT } from "src/constants";
import { useHistory } from "react-router";

interface IRegexReplacement {
  value: RegexReplacementInput;
  setValue: (v: RegexReplacementInput) => void;
  onDelete: () => void;
}

const RegexReplacement: React.FC<IRegexReplacement> = ({
  value,
  setValue,
  onDelete,
}) => (
  <Form.Row>
    <Form.Group as={Col} xs="auto">
      <Button className="minimal" size="sm" onClick={() => onDelete()}>
        <Icon icon="times" />
      </Button>
    </Form.Group>
    <Form.Group as={Col} xs={6}>
      <InputGroup>
        <InputGroup.Prepend>
          <InputGroup.Text>Regex</InputGroup.Text>
        </InputGroup.Prepend>
        <Form.Control
          onChange={(v) => setValue({ ...value, regex: v.currentTarget.value })}
          value={value.regex}
        />
      </InputGroup>
    </Form.Group>
    <Form.Group as={Col} xs={5}>
      <InputGroup>
        <InputGroup.Prepend>
          <InputGroup.Text>Replacement</InputGroup.Text>
        </InputGroup.Prepend>
        <Form.Control
          onChange={(v) =>
            setValue({ ...value, replaceWith: v.currentTarget.value })
          }
          value={value.replaceWith}
        />
      </InputGroup>
    </Form.Group>
  </Form.Row>
);

// TODO - these should be from ImportColumnType, but can't get it to export
const sceneFields = [
  {
    name: "<scene field>",
    value: "",
  },
  {
    name: "Title",
    value: "TITLE",
  },
  {
    name: "Description",
    value: "DESCRIPTION",
  },
  {
    name: "Date",
    value: "DATE",
  },
  {
    name: "Duration",
    value: "DURATION",
  },
  {
    name: "Image",
    value: "IMAGE",
  },
  {
    name: "URL",
    value: "URL",
  },
  {
    name: "Studio",
    value: "STUDIO",
  },
  {
    name: "Performers",
    value: "PERFORMERS",
  },
  {
    name: "Tags",
    value: "TAGS",
  },
];

enum FieldType {
  INPUT_FIELD,
  FIXED_VALUE,
}

const fieldTypes = [
  {
    name: "Input field",
    value: FieldType.INPUT_FIELD,
  },
  {
    name: "Fixed value",
    value: FieldType.FIXED_VALUE,
  },
];

interface IImportField {
  field: ImportFieldInput;
  setField: (v: ImportFieldInput) => void;
  onDelete: () => void;
}

const ImportField: React.FC<IImportField> = ({ field, setField, onDelete }) => {
  const [fieldType, setFieldType] = useState<FieldType>(
    field.fixedValue ? FieldType.FIXED_VALUE : FieldType.INPUT_FIELD
  );

  function setValue(valueType: FieldType, v: string) {
    if (valueType === FieldType.FIXED_VALUE) {
      setField({ ...field, fixedValue: v, inputField: undefined });
    } else if (valueType === FieldType.INPUT_FIELD) {
      setField({ ...field, fixedValue: undefined, inputField: v });
    }
  }

  function changeFieldType(type: FieldType) {
    setFieldType(type);
    setValue(type, "");
  }

  function addRegex() {
    const newRegex: RegexReplacementInput = {
      regex: "",
      replaceWith: "",
    };
    const newReplacements = [...(field.regexReplacements ?? []), newRegex];
    setField({ ...field, regexReplacements: newReplacements });
  }

  function removeRegex(index: number) {
    setField({
      ...field,
      regexReplacements: field.regexReplacements?.filter((v, i) => i !== index),
    });
  }

  function setRegex(index: number, v: RegexReplacementInput) {
    const regexReplacementsCopy = [...(field.regexReplacements ?? [])];
    regexReplacementsCopy[index] = v;
    setField({ ...field, regexReplacements: regexReplacementsCopy });
  }

  return (
    <>
      <Form.Row>
        <Form.Group as={Col} xs="auto">
          <Button className="minimal" size="sm" onClick={() => onDelete()}>
            <Icon icon="times" />
          </Button>
        </Form.Group>
        <Form.Group as={Col}>
          <InputGroup>
            <Form.Control
              as="select"
              onChange={(v) =>
                setField({ ...field, outputField: v.currentTarget.value })
              }
              value={field.outputField}
            >
              {sceneFields.map((f) => (
                <option value={f.value}>{f.name}</option>
              ))}
            </Form.Control>
          </InputGroup>
        </Form.Group>
        <Form.Group as={Col}>
          <InputGroup>
            <Form.Control
              as="select"
              onChange={(v) =>
                changeFieldType(
                  parseInt(v.currentTarget.value, 10) as FieldType
                )
              }
              value={fieldType}
              disabled={!field.outputField}
            >
              {fieldTypes.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.name}
                </option>
              ))}
            </Form.Control>
          </InputGroup>
        </Form.Group>
        <Form.Group as={Col}>
          <InputGroup>
            <InputGroup.Prepend>
              <InputGroup.Text>
                {fieldType === FieldType.INPUT_FIELD ? "Field" : "Value"}
              </InputGroup.Text>
            </InputGroup.Prepend>
            <Form.Control
              onChange={(v) => setValue(fieldType, v.currentTarget.value)}
              value={
                fieldType === FieldType.FIXED_VALUE
                  ? field.fixedValue ?? ""
                  : field.inputField ?? ""
              }
              disabled={!field.outputField}
            />
          </InputGroup>
        </Form.Group>
        <Form.Group as={Col}>
          <Button onClick={() => addRegex()}>Add Replacement</Button>
        </Form.Group>
      </Form.Row>
      <Form.Group>
        {field.regexReplacements?.map((r, i) => (
          <RegexReplacement
            value={r}
            setValue={(v) => setRegex(i, v)}
            onDelete={() => removeRegex(i)}
          />
        ))}
      </Form.Group>
    </>
  );
};

const NewImport: React.FC = () => {
  const [file, setFile] = useState<File>();
  const [fields, setFields] = useState<ImportFieldInput[]>([]);
  const [listDelimiter, setListDelimiter] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [errors, setErrors] = useState<any>();
  const [submitSceneImport] = useSubmitSceneImport();

  const history = useHistory();

  const importScenes = useImportScenes({
    querySpec: {
      page: 1,
      per_page: 0,
    },
  });

  // redirect to complete import page if import is pending
  useEffect(() => {
    if (importScenes.data?.queryImportScenes.count) {
      history.push(ROUTE_COMPLETE_IMPORT);
    } 
  }, [importScenes, history]);

  async function handleSubmit() {
    setErrors("");
    try {
      await submitSceneImport({
        variables: {
          input: {
            type: ImportDataType.CSV,
            data: file,
            fields,
            listDelimiter,
          },
        },
      });

      history.push(ROUTE_COMPLETE_IMPORT);
    } catch (err) {
      setErrors(err.message);
    }
  }

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.validity.valid && event.target.files?.[0]) {
      setFile(event.target.files[0]);
    }
  };

  function addField() {
    const newField: ImportFieldInput = {
      outputField: "",
    };
    setFields([...fields, newField]);
  }

  function setField(index: number, v: ImportFieldInput) {
    const fieldsCopy = [...fields];
    fieldsCopy[index] = v;
    setFields(fieldsCopy);
  }

  function removeField(index: number) {
    setFields(fields.filter((v, i) => i !== index));
  }

  function loadConfig() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = () => {
      if (!input.files?.length) {
        return;
      }

      const configFile = input.files[0];

      const reader = new FileReader();
      reader.readAsText(configFile);

      reader.onload = () => {
        if (typeof reader.result === "string") {
          let data: SubmitImportInput;
          try {
            data = JSON.parse(reader.result) as SubmitImportInput;
          } catch (err) {
            // TODO - toast error
            return;
          }

          setFields([...data.fields]);
          setListDelimiter(data.listDelimiter ?? "");
        }
      };
    };

    input.click();
  }

  function saveConfig() {
    const data = JSON.stringify(
      {
        fields,
        listDelimiter,
      },
      null,
      1
    );
    const a = document.createElement("a");
    const configFile = new Blob([data], { type: "application/json" });
    a.href = URL.createObjectURL(configFile);
    a.download = "config.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <Form>
      <h2>Bulk Import</h2>
      <Form.Group>
        <Form.File onChange={onFileChange} accept=".csv" />
      </Form.Group>
      <Form.Group>
        <Button onClick={() => loadConfig()} className="mr-2">
          Load Config
        </Button>
        <Button onClick={() => saveConfig()}>Save Config</Button>
      </Form.Group>
      <div>
        <h4>Fields:</h4>
        {fields.map((f, i) => (
          <ImportField
            // eslint-disable-next-line react/no-array-index-key
            key={i}
            field={f}
            setField={(v) => setField(i, v)}
            onDelete={() => removeField(i)}
          />
        ))}
        <Button className="minimal" size="sm" onClick={() => addField()}>
          <Icon icon="plus" />
        </Button>
      </div>
      <Form.Group>
        <Form.Label>List delimiter</Form.Label>
        <Form.Control
          name="listDelimiter"
          value={listDelimiter}
          onChange={(v) => setListDelimiter(v.target.value)}
        />
      </Form.Group>
      <Form.Group className="text-danger">{errors}</Form.Group>
      <Button disabled={!file} onClick={() => handleSubmit()}>
        Submit
      </Button>
    </Form>
  );
};

export default NewImport;
