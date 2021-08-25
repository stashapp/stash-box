import React, { useEffect, useState } from "react";
import { Button, Form } from "react-bootstrap";

import {
  ImportDataType,
  useParseImportData,
  useSubmitImport,
} from "src/graphql";
import { ROUTE_MASSAGE_IMPORT } from "src/constants";
import { useHistory } from "react-router";

const NewImport: React.FC = () => {
  const [file, setFile] = useState<File>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [errors, setErrors] = useState<any>();
  const [submitImport] = useSubmitImport();

  const history = useHistory();

  const parseImportData = useParseImportData({
    input: {
      fields: [],
    },
    filter: {
      per_page: 0,
    },
  });

  // redirect to complete import page if import is pending
  useEffect(() => {
    if (parseImportData.data?.parseImportData.count) {
      history.push(ROUTE_MASSAGE_IMPORT);
    }
  }, [parseImportData, history]);

  async function handleSubmit() {
    setErrors("");
    try {
      await submitImport({
        variables: {
          input: {
            type: ImportDataType.CSV,
            data: file,
          },
        },
      });

      history.push(ROUTE_MASSAGE_IMPORT);
    } catch (err) {
      setErrors(err.message);
    }
  }

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.validity.valid && event.target.files?.[0]) {
      setFile(event.target.files[0]);
    }
  };

  return (
    <Form>
      <h2>Bulk Import</h2>
      <Form.Group>
        <Form.File onChange={onFileChange} accept=".csv" />
      </Form.Group>
      <Form.Group className="text-danger">{errors}</Form.Group>
      <Button disabled={!file} onClick={() => handleSubmit()}>
        Submit
      </Button>
    </Form>
  );
};

export default NewImport;
