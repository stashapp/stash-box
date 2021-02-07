import React, { useState } from "react";
import { Button, Card, Col, Form, InputGroup, Row } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import { ImportColumnType, ImportDataType, useAnalyzeData } from "src/graphql";
import { AnalyzeData_analyzeData_results as AnalyzeResult } from "src/graphql/definitions/AnalyzeData";
import { Icon } from "src/components/fragments";
import Pagination from "src/components/pagination";

const schema = yup.object().shape({
  mainStudio: yup.string().required(),
  columns: yup.array().of(
    yup.object().shape({
      enabled: yup.bool(),
      name: yup.string(),
      regularExpression: yup.string().nullable(),
      type:  yup
        .string()
        .nullable()
        .oneOf(Object.keys(ImportColumnType), "Invalid column type"),
    })
  ),
});

const columns = [{
  name: "Title",
  type: ImportColumnType.TITLE,
  defaultValue: "title",
}, {
  name: "Description",
  type: ImportColumnType.DESCRIPTION,
  defaultValue: "description",
}, {
  name: "Date",
  type: ImportColumnType.DATE,
  defaultValue: "date",
}, {
  name: "Duration",
  type: ImportColumnType.DURATION,
  defaultValue: "duration",
}, {
  name: "Image",
  type: ImportColumnType.IMAGE,
  defaultValue: "image",
}, {
  name: "URL",
  type: ImportColumnType.URL,
  defaultValue: "url",
}, {
  name: "Studio",
  type: ImportColumnType.STUDIO,
  defaultValue: "studio",
}, {
  name: "Performers",
  type: ImportColumnType.PERFORMERS,
  defaultValue: "performers",
}, {
  name: "Tags",
  type: ImportColumnType.TAGS,
  defaultValue: "tags",
}];

const PER_PAGE = 40;

type ColumnData = yup.InferType<typeof schema>;

const Import: React.FC = () => {
  const [file, setFile] = useState<File>();
  const [page, setPage] = useState(1);
  const [analyzeData] = useAnalyzeData();
  const [importData] = useImportData();
  const { register, handleSubmit } = useForm<ColumnData>({ resolver: yupResolver(schema) });
  const [results, setResults] = useState<AnalyzeResult[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);

  const submitData = (data: ColumnData) => {
    if (!data.columns) return;

    const columnData = data.columns.filter(c => c.enabled).map(c => ({
      name: (c.name || "") as string,
      type: c.type as ImportColumnType,
      regularExpression: (c?.regularExpression ?? "").trim() === "" ? null : (c?.regularExpression ?? "").trim(),
    }));

    analyzeData({
      variables: {
        input: {
          type: ImportDataType.CSV,
          columns: columnData,
          mainStudio: data.mainStudio,
          data: file,
        }
      },
    }).then(res => {
      setResults(res.data?.analyzeData.results ?? []);
      setParseErrors(res.data?.analyzeData.errors ?? []);
    });
  }

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (
      event.target.validity.valid &&
      event.target.files?.[0]
    ) {
      setFile(event.target.files[0]);
    }
  }

  return (
    <Form onSubmit={handleSubmit(submitData)}>
      <h2>Bulk Import</h2>
      <Form.File onChange={onFileChange} accept=".json,.csv" />
      <Form.Group controlId="mainStudio">
        <Form.Label>Main Studio</Form.Label>
        <Form.Control name="mainStudio" ref={register} />
      </Form.Group>
      <div>
        <h4>Columns:</h4>
        { columns.map((c, i) => (
          <Form.Row key={c.type}>
            <Form.Control type="hidden" name={`columns[${i}].type`} value={c.type} ref={register} />
            <Form.Group controlId={`columns[${i}].enabled`} className="align-self-end col-2">
              <Form.Check name={`columns[${i}].enabled`} ref={register} defaultChecked inline />
              <Form.Label>{ c.name }</Form.Label>
            </Form.Group>
            <Form.Group as={Col}>
              <InputGroup>
                <InputGroup.Prepend>
                  <InputGroup.Text>Name</InputGroup.Text>
                </InputGroup.Prepend>
                <Form.Control name={`columns[${i}].name`} ref={register} defaultValue={c.defaultValue ?? ""} />
              </InputGroup>
            </Form.Group>
            <Form.Group as={Col} xs={6}>
              <InputGroup>
                <InputGroup.Prepend>
                  <InputGroup.Text>Regular Expression</InputGroup.Text>
                </InputGroup.Prepend>
                <Form.Control name={`columns[${i}].regularExpression`} ref={register} />
              </InputGroup>
            </Form.Group>
          </Form.Row>
        ))}
      </div>
      <Button type="submit" disabled={!file}>Analyze</Button>
      <Button type="submit" className="ml-2" disabled={!file || !results.length} variant="danger">Submit</Button>

      { parseErrors.length > 0 && (
        <>
          <h4>Errors:</h4>
          <ul>
            { parseErrors.map(error => <li>{error}</li>) }
          </ul>
        </>
      )}
      { results.length > 0 && (
        <>
          <hr />
          <Row noGutters>
            <h2>{ results.length } Results:</h2>
            <Pagination perPage={PER_PAGE} active={page} onClick={setPage} count={results.length}  />
          </Row>
        </>
      )}
      { results.length > 0 && results.slice((page - 1) * PER_PAGE, page * PER_PAGE).map(result => (
        <Card className="p-3">
            <Row>
              <Col xs={8}>
                <Row>
                  <Col>
                    <b>Title:</b> {result.title}
                  </Col>
                </Row>
                <Row>
                  <Col>
                    { result.date && (
                      <span className="mr-2">
                        <b>Date:</b> { result.date }
                      </span>
                    )}
                    { result.duration !== null && result.duration !== 0 && (
                      <span className="mr-2">
                        <b>Duration:</b> { new Date(result.duration * 1000).toISOString().substr(11, 8) }
                      </span>
                    )}
                    { result.studio && (
                      <span className="mr-2">
                        <b>Studio:</b> { result.studio.existingStudio
                          ? <span>
                              <Icon icon="video" className="mr-1" />
                              <Link to={`/studios/${result.studio.existingStudio.id}`}>{result.studio.existingStudio.name}</Link>
                            </span>
                          : <span>
                              <Icon icon="star" color="gold" className="mr-1" />
                              <span>{result.studio?.name ?? ""}</span>
                            </span>
                        }
                      </span>
                    )}
                  </Col>
                </Row>
                <Row>
                  <Col><b>URL:</b> <a href={ result.url ?? '' } target="_blank" rel="noopener noreferrer">{ result.url }</a></Col>
                </Row>
                <Row>
                  <Col><b>Performers:</b> { result.performers.map(p => (
                    p?.existingPerformer
                    ? <span className="mr-2">
                        <Icon icon="user-check" color="success" className="mr-1" />
                        <Link to={`/performers/${p.existingPerformer.id}`}>{p.existingPerformer.name}</Link>
                      </span>
                    : <span className="mr-2">
                        <Icon icon="star" color="gold" className="mr-1" />
                        <span>{p.name ?? ""}</span>
                      </span>
                    ))}
                  </Col>
                </Row>
                <Row>
                  <Col>{ result.tags.length > 0 && (
                    <>
                      <b>Tags:</b> {
                        result.tags.map(t => (
                          t?.existingTag
                          ? <small className="mr-2">
                              <Icon icon="tag" className="mr-1" />
                              <Link to={`/tags/${t.existingTag.name}`}>{t.existingTag.name}</Link>
                            </small>
                          : <small className="mr-2">
                              <Icon icon="star" color="gold" className="mr-1" />
                              <span>{t.name ?? ""}</span>
                            </small>
                        ))
                      }
                    </>
                  )}
                  </Col>
                </Row>
                { result.description && (
                  <Row>
                    <Col>
                      <b>Description:</b>
                      <div>
                        <small>{ result.description }</small>
                      </div>
                    </Col>
                  </Row>
                )}
              </Col>
              <Col xs={4}>
                { result.image && (
                  <img src={result.image} alt="" className="w-100" />
                )}
              </Col>
            </Row>
        </Card>
      ))}
    </Form>
  );
}

export default Import;
