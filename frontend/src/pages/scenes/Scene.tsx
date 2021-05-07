import React, { useContext } from "react";
import { Link, useHistory, useParams } from "react-router-dom";
import { Button, Card, Tabs, Tab, Table } from "react-bootstrap";

import { useScene, useDeleteScene } from "src/graphql";
import AuthContext from "src/AuthContext";
import {
  isAdmin,
  getImage,
  getUrlByType,
  tagHref,
  performerHref,
  studioHref,
  createHref,
  formatDuration,
} from "src/utils";
import { ROUTE_SCENE_EDIT, ROUTE_SCENES } from "src/constants/route";
import {
  GenderIcon,
  LoadingIndicator,
  TagLink,
  PerformerName,
} from "src/components/fragments";
import DeleteButton from "src/components/deleteButton";

const SceneComponent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const { loading, data } = useScene({ id });
  const [deleteScene, { loading: deleting }] = useDeleteScene();
  const auth = useContext(AuthContext);

  if (loading) return <LoadingIndicator message="Loading scene..." />;
  if (!data?.findScene) return <div>Scene not found!</div>;
  const scene = data.findScene;

  const handleDelete = (): void => {
    deleteScene({ variables: { input: { id: scene.id } } }).then(() =>
      history.push(ROUTE_SCENES)
    );
  };

  const performers = data.findScene.performers
    .map((performance) => {
      const { performer } = performance;
      return (
        <Link
          key={performer.id}
          to={performerHref(performer)}
          className="scene-performer"
        >
          <GenderIcon gender={performer.gender} />
          <PerformerName performer={performer} as={performance.as} />
        </Link>
      );
    })
    .map((p, index) => (index % 2 === 2 ? [" • ", p] : p));

  const fingerprints = scene.fingerprints.map((fingerprint) => (
    <tr key={fingerprint.hash}>
      <td>{fingerprint.algorithm}</td>
      <td>
        <Link
          to={`${createHref(ROUTE_SCENES)}?fingerprint=${fingerprint.hash}`}
        >
          {fingerprint.hash}
        </Link>
      </td>
      <td>{fingerprint.duration}</td>
    </tr>
  ));
  const tags = [...scene.tags]
    .sort((a, b) => {
      if (a.name > b.name) return 1;
      if (a.name < b.name) return -1;
      return 0;
    })
    .map((tag) => (
      <li key={tag.name}>
        <TagLink title={tag.name} link={tagHref(tag)} />
      </li>
    ));

  return (
    <>
      <Card className="scene-info">
        <Card.Header>
          <div className="float-right">
            {isAdmin(auth.user) && (
              <>
                <Link to={createHref(ROUTE_SCENE_EDIT, { id })}>
                  <Button>Edit</Button>
                </Link>
                <DeleteButton
                  onClick={handleDelete}
                  className="ml-2"
                  disabled={deleting}
                  message="Do you want to delete scene? This cannot be undone."
                />
              </>
            )}
          </div>
          <h3>{scene.title}</h3>
          <h6>
            {scene.studio && (
              <>
                <Link to={studioHref(scene.studio)}>{scene.studio.name}</Link>
                <span className="mx-1">•</span>
              </>
            )}
            {scene.date}
          </h6>
        </Card.Header>
        <Card.Body className="scene-photo">
          <img
            alt=""
            src={getImage(scene.images, "landscape")}
            className="scene-photo-element"
          />
        </Card.Body>
        <Card.Footer className="row mx-1">
          <div className="scene-performers mr-auto">{performers}</div>
          {scene.duration && (
            <div>
              Duration: <b>{formatDuration(scene.duration)}</b>
            </div>
          )}
          {scene.director && (
            <div className="ml-3">
              Director: <strong>{scene.director}</strong>
            </div>
          )}
        </Card.Footer>
      </Card>
      <Tabs defaultActiveKey="description" id="scene-tab">
        <Tab eventKey="description" title="Description">
          <div className="scene-description my-4">
            <h4>Description:</h4>
            <div>{scene.details}</div>
            <div className="scene-tags">
              <h6>Tags:</h6>
              <ul className="scene-tag-list">{tags}</ul>
            </div>
            <hr />
            <div>
              <strong className="mr-2">Studio URL: </strong>
              <a
                href={getUrlByType(scene.urls, "STUDIO")}
                target="_blank"
                rel="noopener noreferrer"
              >
                {getUrlByType(scene.urls, "STUDIO")}
              </a>
            </div>
          </div>
        </Tab>
        <Tab eventKey="fingerprints" title="Fingerprints">
          <div className="scene-fingerprints my-4">
            <h4>Fingerprints:</h4>
            {fingerprints.length === 0 ? (
              <h6>No fingerprints found for this scene.</h6>
            ) : (
              <Table striped bordered size="sm">
                <thead>
                  <tr>
                    <td>
                      <b>Algorithm</b>
                    </td>
                    <td>
                      <b>Hash</b>
                    </td>
                    <td>
                      <b>Duration</b>
                    </td>
                  </tr>
                </thead>
                <tbody>{fingerprints}</tbody>
              </Table>
            )}
          </div>
        </Tab>
      </Tabs>
    </>
  );
};

export default SceneComponent;
