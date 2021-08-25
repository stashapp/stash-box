import React, { useEffect, useState } from "react";
import { Button, Card, Col, Form, InputGroup, Row } from "react-bootstrap";

import {
  ImportFieldInput,
  MassageImportDataInput,
  RegexReplacementInput,
  useAbortImport,
  useMassageImportData,
  useParseImportData,
} from "src/graphql";
import { Icon, LoadingIndicator } from "src/components/fragments";
import { ROUTE_COMPLETE_IMPORT, ROUTE_IMPORT } from "src/constants";
import { useHistory } from "react-router";
import Pagination from "src/components/pagination";
import { ParseImportData_parseImportData_data } from "src/graphql/definitions/ParseImportData";

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

interface IImportRow {
  matchedFields: string[];
  unmatchedFields: string[];
  data: ParseImportData_parseImportData_data[]
}

const ImportRow: React.FC<IImportRow> = ({matchedFields, unmatchedFields, data}) => {
  function renderValues(v: string[]) {
    if (v.length > 1) {
      return (
        <ul>
          {v.map(vv => <li>{vv}</li>)}
        </ul>
      );
    }

    return v[0];
  }

  function renderIcon(matched: boolean) {
    if (!matched) 
      return <Icon icon="question" className="mr-1" />
    
    return <Icon icon="check" className="mr-1" color="#0f9960"/>
  }
  
  function renderField(field: string, matched: boolean) {
    const cn = matched ? "matched" : "unmatched";
    const tuple = data.find(dd => dd.field === field);
    if (!tuple || tuple.value.length === 0) {
      return;
    }

    return (
      <>
        <dt className={cn}>{renderIcon(matched)} {field}</dt>
        <dd className={cn}>{renderValues(tuple.value)}</dd>
      </>
    );
  }

  return (
    <Card className="p-3">
      <dl className="import-raw-data">
        {matchedFields.map(f => renderField(f, true))}
        {unmatchedFields.map(f => renderField(f, false))}
      </dl>
    </Card>
  );
}

const PER_PAGE = 20;

const MassageImport: React.FC = () => {
  const [fields, setFields] = useState<ImportFieldInput[]>([]);
  const [listDelimiter, setListDelimiter] = useState("");
  const [massageInput, setMassageInput] = useState<MassageImportDataInput>({
    fields,
    listDelimiter,
  });
  const [matchedFields, setMatchedFields] = useState<string[]>([]);
  const [unmatchedFields, setUnmatchedFields] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [errors, setErrors] = useState<any>();
  const [loading, setLoading] = useState(false);

  const parseImportData = useParseImportData({
    input: massageInput,
    filter: {
      page,
      per_page: PER_PAGE,
    }
  });

  const [massageImportData] = useMassageImportData();
  const [abortImport] = useAbortImport();

  const history = useHistory();

  // update header fields
  useEffect(() => {
    const newMatchedResultFields: string[] = []
    const newUnmatchedResultFields: string[] = [];
    parseImportData.data?.parseImportData.data.forEach((v) => {
      v.forEach(f => {
        // show matched fields first
        if (!newUnmatchedResultFields.includes(f.field) && !newMatchedResultFields.includes(f.field)) {
          if (sceneFields.some(ff => ff.value === f.field)) {
            newMatchedResultFields.push(f.field);
          } else {
            newUnmatchedResultFields.push(f.field);
          }
        }
      });
    });
    setMatchedFields(newMatchedResultFields);
    setUnmatchedFields(newUnmatchedResultFields);
  }, [parseImportData]);
  

  // redirect to submit import page if import is not pending
  useEffect(() => {
    if (parseImportData.data?.parseImportData.count === 0) {
      history.push(ROUTE_IMPORT);
    }
  }, [parseImportData, history]);

  async function handleSubmit() {
    setErrors("");
    try {
      await massageImportData({
        variables: {
          input: {
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

  async function handlePreview(thisFields?: ImportFieldInput[], thisDelimiter?: string) {
    setMassageInput({
      fields: thisFields ?? fields,
      listDelimiter: thisDelimiter ?? listDelimiter,
    })
  }

  async function handleAbortImport() {
    setLoading(true);
    try {
      await abortImport();
      history.push(ROUTE_IMPORT);
    } finally {
      setLoading(false);
    }
  }

  function handleContinue() {
    history.push(ROUTE_COMPLETE_IMPORT);
  }

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
          let data: MassageImportDataInput;
          try {
            data = JSON.parse(reader.result) as MassageImportDataInput;
          } catch (err) {
            // TODO - toast error
            return;
          }

          const newFields = [...data.fields];
          const newDelimiter = data.listDelimiter ?? "";
          setFields(newFields);
          setListDelimiter(newDelimiter);
          handlePreview(newFields, newDelimiter);
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

  function renderResults() {
    if (loading || parseImportData.loading) {
      return <LoadingIndicator />;
    }

    return (
      <div>
        <hr />
        <h2>{parseImportData.data?.parseImportData.count} rows loaded.</h2>

        <div>
          <Row noGutters>
            <Pagination
              perPage={PER_PAGE}
              active={page}
              onClick={setPage}
              count={parseImportData.data?.parseImportData.count ?? 0}
            />
          </Row>
        </div>

        {parseImportData.data?.parseImportData.data.map(r => (
          <ImportRow matchedFields={matchedFields} unmatchedFields={unmatchedFields} data={r} />
        ))}
      </div>
    );
  }

  return (
    <>
      <Form>
        <h2>Massage Import Data</h2>
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
        <div className="d-flex">
          <Button onClick={() => handlePreview()} className="mr-2">
            Preview
          </Button>
          <div className="ml-auto" />
          <Button onClick={() => handleAbortImport()} variant="danger" className="mr-2">
            Cancel Import
          </Button>
          <Button onClick={() => handleSubmit()} className="mr-2">
            Save and Continue
          </Button>
          <Button onClick={() => handleContinue()}>
            Continue without Saving
          </Button>
        </div>
      </Form>

      {renderResults()}
    </>
  );
};

export default MassageImport;
