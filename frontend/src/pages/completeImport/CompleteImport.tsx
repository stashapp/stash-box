import React, { useEffect, useState } from "react";
import { Button, Card, Col, Form, Row } from "react-bootstrap";
import { useHistory } from "react-router";
import { Link } from "react-router-dom";
import { Icon } from "src/components/fragments";
import { ROUTE_IMPORT } from "src/constants";
import {
  ImportMappingInput,
  useAbortSceneImport,
  useCompleteSceneImport,
  useImportSceneMappings,
  useImportScenes,
} from "src/graphql";
import Pagination from "src/components/pagination";

const PER_PAGE = 40;

const CompleteImport: React.FC = () => {
  const [page, setPage] = useState(1);
  const [studioMappings, setStudioMappings] = useState<ImportMappingInput[]>(
    []
  );
  const [performerMappings, setPerformerMappings] = useState<
    ImportMappingInput[]
  >([]);
  const [tagMappings, setTagMappings] = useState<ImportMappingInput[]>([]);

  const history = useHistory();

  const importScenes = useImportScenes({
    querySpec: {
      page,
      per_page: PER_PAGE,
    },
  });

  const sceneMappings = useImportSceneMappings();
  const [completeImport] = useCompleteSceneImport();
  const [abortImport] = useAbortSceneImport();

  const sceneCount = importScenes.data?.queryImportScenes.count ?? 0;
  const scenes = importScenes.data?.queryImportScenes.scenes;

  useEffect(() => {
    const data = importScenes.data?.queryImportScenes;
    if (data && data.count === 0) {
      history.push(ROUTE_IMPORT);
    }
  }, [importScenes, history]);

  useEffect(() => {
    const data = sceneMappings.data?.queryImportSceneMappings;
    if (!data) {
      return;
    }

    const performerMap = data.performers.map((p) => ({
      name: p.name,
      id: p.existingPerformer?.id,
    }));
    const studioMap = data.studios.map((s) => ({
      name: s.name,
      id: s.existingStudio?.id,
    }));
    const tagMap = data.tags.map((p) => ({
      name: p.name,
      id: p.existingTag?.id,
    }));

    setPerformerMappings(performerMap);
    setStudioMappings(studioMap);
    setTagMappings(tagMap);
  }, [sceneMappings]);

  function findMapping(name: string, mappings: ImportMappingInput[]) {
    return mappings.find((m) => m.name === name);
  }

  function renderStudio(name: string) {
    const studio = findMapping(name, studioMappings);

    return studio && studio.id ? (
      <span className="mx-2">
        <Icon icon="video" className="mr-1" />
        <Link to={`/studios/${studio.id}`}>{name}</Link>
      </span>
    ) : (
      <span className="mx-2">
        <Icon icon="star" color="gold" className="mr-1" />
        <span>{name}</span>
      </span>
    );
  }

  function renderPerformer(name: string) {
    const performer = findMapping(name, performerMappings);

    return performer && performer.id ? (
      <span className="mx-2">
        <Icon icon="user-check" color="success" className="mr-1" />
        <Link to={`/performers/${performer.id}`}>{name}</Link>
      </span>
    ) : (
      <span className="mx-2">
        <Icon icon="star" color="gold" className="mr-1" />
        <span>{name}</span>
      </span>
    );
  }

  function renderTag(name: string) {
    const tag = findMapping(name, tagMappings);

    return tag && tag.id ? (
      <small className="mx-2">
        <Icon icon="tag" color="success" className="mr-1" />
        <Link to={`/tags/${tag.id}`}>{name}</Link>
      </small>
    ) : (
      <small className="mx-2">
        <Icon icon="star" color="gold" className="mr-1" />
        <span>{name}</span>
      </small>
    );
  }

  async function handleSubmit() {
    await completeImport();
    history.push(ROUTE_IMPORT);
  }

  async function handleAbortImport() {
    await abortImport();
    history.push(ROUTE_IMPORT);
  }

  return (
    <Form>
      <h2>Bulk Import</h2>

      {sceneCount && <h2>{sceneCount} scenes loaded.</h2>}

      <h3>Mappings</h3>

      <Button onClick={() => handleSubmit()} className="mr-2">
        Submit
      </Button>
      <Button onClick={() => handleAbortImport()} variant="danger">
        Abort
      </Button>

      {sceneCount > 0 && (
        <>
          <hr />
          <Row noGutters>
            <Pagination
              perPage={PER_PAGE}
              active={page}
              onClick={setPage}
              count={sceneCount}
            />
          </Row>
        </>
      )}
      {(scenes ?? []).map((result) => (
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
                  {result.date && (
                    <span className="mr-2">
                      <b>Date:</b> {result.date}
                    </span>
                  )}
                  {result.duration !== null && result.duration !== 0 && (
                    <span className="mr-2">
                      <b>Duration:</b>{" "}
                      {new Date(result.duration * 1000)
                        .toISOString()
                        .substr(11, 8)}
                    </span>
                  )}
                  {result.studio && (
                    <span className="mr-2">
                      <b>Studio:</b>
                      {renderStudio(result.studio)}
                    </span>
                  )}
                </Col>
              </Row>
              <Row>
                <Col>
                  <b>URL:</b>{" "}
                  <a
                    href={result.url ?? ""}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {result.url}
                  </a>
                </Col>
              </Row>
              <Row>
                {result.performers.length > 0 && (
                  <Col>
                    <b>Performers:</b>
                    {result.performers.map((p) => renderPerformer(p))}
                  </Col>
                )}
              </Row>
              <Row>
                {result.tags.length > 0 && (
                  <Col>
                    <b>Tags:</b>
                    {result.tags.map((t) => renderTag(t))}
                  </Col>
                )}
              </Row>
              {result.description && (
                <Row>
                  <Col>
                    <b>Description:</b>
                    <div>
                      <small>{result.description}</small>
                    </div>
                  </Col>
                </Row>
              )}
            </Col>
            <Col xs={4}>
              {result.image && (
                <img src={result.image} alt="" className="w-100" />
              )}
            </Col>
          </Row>
        </Card>
      ))}
    </Form>
  );
};

export default CompleteImport;
