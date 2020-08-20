import React, { useContext } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { Link, useHistory, useParams } from "react-router-dom";
import { Button, Card, Tabs, Tab, Table } from "react-bootstrap";
import { loader } from "graphql.macro";

import { Scene } from "src/definitions/Scene";
import {
  DeleteSceneMutation,
  DeleteSceneMutationVariables,
} from "src/definitions/DeleteSceneMutation";

import AuthContext from "src/AuthContext";
import { getImage, getUrlByType } from "src/utils/transforms";
import { canEdit, isAdmin } from "src/utils/auth";

import {
  GenderIcon,
  LoadingIndicator,
  TagLink,
  PerformerName,
} from "src/components/fragments";
import DeleteButton from "src/components/deleteButton";

const SceneQuery = loader("src/queries/Scene.gql");
const DeleteScene = loader("src/mutations/DeleteScene.gql");

const SceneComponent: React.FC = () => {
  const { id } = useParams();
  const history = useHistory();
  const { loading, data } = useQuery<Scene>(SceneQuery, {
    variables: { id },
  });
  const [deleteScene, { loading: deleting }] = useMutation<
    DeleteSceneMutation,
    DeleteSceneMutationVariables
  >(DeleteScene);
  const auth = useContext(AuthContext);

  if (loading) return <LoadingIndicator message="Loading scene..." />;
  if (!data?.findScene) return <div>Scene not found!</div>;
  const scene = data.findScene;

  const handleDelete = (): void => {
    deleteScene({ variables: { input: { id: scene.id } } }).then(() =>
      history.push("/scenes")
    );
  };

  const performers = data.findScene.performers
    .map((performance) => {
      const { performer } = performance;
      return (
        <Link
          key={performer.id}
          to={`/performers/${performer.id}`}
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
      <td>{fingerprint.hash}</td>
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
        <TagLink title={tag.name} link={`/tags/${tag.name}`} />
      </li>
    ));

  return (
    <>
      <Card className="scene-info">
        <Card.Header>
          <div className="float-right">
            {canEdit(auth.user) && (
              <Link to={`${id}/edit`}>
                <Button>Edit</Button>
              </Link>
            )}
            {isAdmin(auth.user) && (
              <DeleteButton
                onClick={handleDelete}
                disabled={deleting}
                message="Do you want to delete scene? This cannot be undone."
              />
            )}
          </div>
          <h2>{scene.title}</h2>
          <h6>
            {scene.studio && (
              <>
                <Link to={`/studios/${scene.studio.id}`}>
                  {scene.studio.name}
                </Link>
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
          <div className="scene-performers">{performers}</div>
          {scene.director && (
            <div className="ml-auto">
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
              <strong className="mr-2">Studio: </strong>
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
              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    <td>Algorithm</td>
                    <td>Hash</td>
                    <td>Duration</td>
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
