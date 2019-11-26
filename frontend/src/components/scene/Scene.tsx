import React, { useState, useContext } from 'react';
import { useQuery, useMutation } from '@apollo/react-hooks';
import { RouteComponentProps, Link, navigate } from '@reach/router';
import { Card } from 'react-bootstrap';

import AuthContext from 'src/AuthContext';
import SceneQuery from 'src/queries/Scene.gql';
import DeleteSceneMutation from 'src/mutations/DeleteScene.gql';
import { Scene } from 'src/definitions/Scene';

import Modal from 'src/components/modal';
import { GenderIcon, LoadingIndicator } from 'src/components/fragments';

interface SceneProps extends RouteComponentProps<{
    id: string;
}> {}

const SceneComponent: React.FC<SceneProps> = ({ id }) => {
    const [showDelete, setShowDelete] = useState(false);
    const { loading, data } = useQuery<Scene>(SceneQuery, {
        variables: { id }
    });
    const [deleteScene, { loading: deleting }] = useMutation(DeleteSceneMutation);
    const auth = useContext(AuthContext);

    if (loading)
        return <LoadingIndicator message="Loading scene..." />;
    const scene = data.getScene;

    const toggleModal = () => setShowDelete(true);
    const handleDelete = (status:boolean):void => {
        if (status)
            deleteScene({ variables: { sceneId: scene.id } }).then(() => navigate('/scenes'));
        setShowDelete(false);
    };

    const performers = data.getScene.performers.map((performance) => {
        const { performer } = performance;
        return (
            <Link key={performer.uuid} to={`/performer/${performer.uuid}`} className="scene-performer">
                <GenderIcon gender={performer.gender} />
                {performer.displayName}
            </Link>
        );
    }).map((p, index) => (index % 2 === 2 ? [' • ', p] : p));

    const deleteModal = showDelete && (
        <Modal
            message={`Are you sure you want to delete '${scene.title}'? This operation cannot be undone.`}
            callback={handleDelete}
        />
    );
    const deleteButton = auth.user.role > 1 && (
        <button type="button" disabled={showDelete || deleting} className="btn btn-danger" onClick={toggleModal}>
            Delete
        </button>
    );

    return (
        <>
            { deleteModal }
            <Card className="scene-info">
                <Card.Header>
                    <div className="float-right">
                        <Link to="edit">
                            <button type="button" className="btn btn-secondary">Edit</button>
                        </Link>
                        { deleteButton }
                    </div>
                    <h2>{scene.title}</h2>
                    <h6>
                        <Link to={`/studio/${scene.studio.uuid}`}>{scene.studio.title}</Link>
                        {' '}
•
                        {' '}
                        { scene.date}
                    </h6>
                </Card.Header>
                <Card.Body className="scene-photo">
                    <img alt="" src={scene.photoUrl} className="scene-photo-element" />
                </Card.Body>
                <Card.Footer>
                    <div className="scene-performers">{ performers }</div>
                </Card.Footer>
            </Card>
            <div className="scene-description">
                <h2>Description:</h2>
                <div>{scene.description}</div>
                <hr />
                <a href={scene.studioUrl}>{scene.studioUrl}</a>
            </div>
        </>
    );
};

export default SceneComponent;
