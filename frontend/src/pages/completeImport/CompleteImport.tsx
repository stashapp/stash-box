import React, { useEffect, useState } from "react";
import { Button, Card, Col, Form, Row } from "react-bootstrap";
import { useHistory } from "react-router";
import { Link } from "react-router-dom";
import { Icon, LoadingIndicator } from "src/components/fragments";
import { ROUTE_IMPORT, ROUTE_MASSAGE_IMPORT } from "src/constants";
import {
  ImportMappingInput,
  useAbortImport,
  useCompleteSceneImport,
  useImportSceneMappings,
  useImportScenes,
} from "src/graphql";
import Pagination from "src/components/pagination";

const PER_PAGE = 40;

interface ObjectMapping {
  name: string;
  id?: string | null;
  existingName?: string;
}

const CompleteImport: React.FC = () => {
  const [page, setPage] = useState(1);
  const [studioMappings, setStudioMappings] = useState<ObjectMapping[]>([]);
  const [performerMappings, setPerformerMappings] = useState<ObjectMapping[]>(
    []
  );
  const [tagMappings, setTagMappings] = useState<ObjectMapping[]>([]);
  const [loading, setLoading] = useState(false);

  const history = useHistory();

  const importScenes = useImportScenes({
    querySpec: {
      page,
      per_page: PER_PAGE,
    },
  });

  const sceneMappings = useImportSceneMappings();
  const [completeImport] = useCompleteSceneImport();
  const [abortImport] = useAbortImport();

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
      existingName: p.existingPerformer?.name,
    }));
    const studioMap = data.studios.map((s) => ({
      name: s.name,
      id: s.existingStudio?.id,
      existingName: s.existingStudio?.name,
    }));
    const tagMap = data.tags.map((t) => ({
      name: t.name,
      id: t.existingTag?.id,
      existingName: t.existingTag?.name,
    }));

    setPerformerMappings(performerMap);
    setStudioMappings(studioMap);
    setTagMappings(tagMap);
  }, [sceneMappings]);

  function findMapping(name: string, mappings: ObjectMapping[]) {
    return mappings.find((m) => m.name === name);
  }

  function mappingToInput(mappings: ObjectMapping[]): ImportMappingInput[] {
    return mappings.map((m) => ({
      name: m.name,
      id: m.id,
    }));
  }

  function renderName(name: string, mapping: ObjectMapping) {
    if (mapping.existingName && mapping.name !== mapping.existingName) {
      return `${name} (${mapping.existingName})`;
    }
    return name;
  }

  function renderStudio(name: string) {
    const studio = findMapping(name, studioMappings);

    return studio && studio.id ? (
      <span className="mx-2">
        <Icon icon="video" className="mr-1" />
        <Link to={`/studios/${studio.id}`}>{renderName(name, studio)}</Link>
      </span>
    ) : (
      <span className="mx-2">
        <Icon icon="question" className="mr-1" />
        <span className="text-muted">{name}</span>
      </span>
    );
  }

  function renderPerformer(name: string) {
    const performer = findMapping(name, performerMappings);

    return performer && performer.id ? (
      <span className="mx-2">
        <Icon icon="user-check" color="success" className="mr-1" />
        <Link to={`/performers/${performer.id}`}>
          {renderName(name, performer)}
        </Link>
      </span>
    ) : (
      <span className="mx-2">
        <Icon icon="question" className="mr-1" />
        <span className="text-muted">{name}</span>
      </span>
    );
  }

  function renderTag(name: string) {
    const tag = findMapping(name, tagMappings);

    return tag && tag.id ? (
      <small className="mx-2">
        <Icon icon="tag" color="success" className="mr-1" />
        <Link to={`/tags/${tag.id}`}>{renderName(name, tag)}</Link>
      </small>
    ) : (
      <small className="mx-2">
        <Icon icon="question" className="mr-1" />
        <span className="text-muted">{name}</span>
      </small>
    );
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      await completeImport({
        variables: {
          input: {
            performers: mappingToInput(performerMappings),
            studios: mappingToInput(studioMappings),
            tags: mappingToInput(tagMappings),
          },
        },
      });
      history.push(ROUTE_IMPORT);
    } finally {
      setLoading(false);
    }

    // TODO - error handling
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

  function handleBack() {
    history.push(ROUTE_MASSAGE_IMPORT);
  }

  if (loading) {
    return <LoadingIndicator message={`Importing ${sceneCount} scenes...`} />;
  }

  return (
    <Form>
      <h2>Bulk Import</h2>

      {sceneCount && <h2>{sceneCount} scenes loaded.</h2>}

      {/* TODO */}
      {/* <h3>Mappings</h3> */}

      <div className="d-flex">
        <Button onClick={() => handleBack()} className="mr-2">
          Massage Data
        </Button>
        <div className="ml-auto" />
        <Button onClick={() => handleAbortImport()} variant="danger" className="mr-2">
          Cancel Import
        </Button>
        <Button onClick={() => handleSubmit()} className="mr-2">
          Complete Import
        </Button>
      </div>

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
