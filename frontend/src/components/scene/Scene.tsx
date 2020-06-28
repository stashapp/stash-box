import React, { useState, useContext } from "react";
import { useQuery, useMutation } from "@apollo/react-hooks";
import { Link, useHistory, useParams } from "react-router-dom";
import { Button, Card, Tabs, Tab, Table } from "react-bootstrap";
import { loader } from "graphql.macro";

import AuthContext from "src/AuthContext";
import { Scene } from "src/definitions/Scene";
import { getImage, getUrlByType } from "src/utils/transforms";
import { canEdit, isAdmin } from "src/utils/auth";
import {
  DeleteSceneMutation,
  DeleteSceneMutationVariables,
} from "src/definitions/DeleteSceneMutation";

import Modal from "src/components/modal";
import {
  GenderIcon,
  LoadingIndicator,
  TagLink,
  PerformerName,
} from "src/components/fragments";

const SceneQuery = loader("src/queries/Scene.gql");
const DeleteScene = loader("src/mutations/DeleteScene.gql");

const SceneComponent: React.FC = () => {
  const { id } = useParams();
  const history = useHistory();
  const [showDelete, setShowDelete] = useState(false);
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

  const toggleModal = () => setShowDelete(true);
  const handleDelete = (status: boolean): void => {
    if (status)
      deleteScene({ variables: { input: { id: scene.id } } }).then(() =>
        history.push("/scenes")
      );
    setShowDelete(false);
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
  const tags = scene.tags.map((tag) => (
    <li key={tag.name}>
      <TagLink
        title={tag.name}
        link={`/tags/${encodeURIComponent(tag.name)}`}
      />
    </li>
  ));

  const deleteModal = showDelete && (
    <Modal
      message={`Are you sure you want to delete '${scene.title}'? This operation cannot be undone.`}
      callback={handleDelete}
    />
  );
  return (
    <>
      {deleteModal}
      <Card className="scene-info">
        <Card.Header>
          <div className="float-right">
            {canEdit(auth.user) && (
              <Link to={`${id}/edit`}>
                <Button variant="secondary">Edit</Button>
              </Link>
            )}
            {isAdmin(auth.user) && (
              <Button
                variant="danger"
                className="ml-2"
                disabled={showDelete || deleting}
                onClick={toggleModal}
              >
                Delete
              </Button>
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
              <a href={getUrlByType(scene.urls, "STUDIO")}>
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
