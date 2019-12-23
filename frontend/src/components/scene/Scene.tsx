import React, { useState, useContext } from 'react';
import { useQuery, useMutation } from '@apollo/react-hooks';
import { Link, useHistory, useParams } from 'react-router-dom';
import { Card } from 'react-bootstrap';

import AuthContext from 'src/AuthContext';
import SceneQuery from 'src/queries/Scene.gql';
import DeleteScene from 'src/mutations/DeleteScene.gql';
import { Scene } from 'src/definitions/Scene';
import { getUrlByType } from 'src/utils/transforms';
import {
    DeleteSceneMutation,
    DeleteSceneMutationVariables
} from 'src/definitions/DeleteSceneMutation';

import Modal from 'src/components/modal';
import { GenderIcon, LoadingIndicator } from 'src/components/fragments';

const SceneComponent: React.FC = () => {
    const { id } = useParams();
    const history = useHistory();
    const [showDelete, setShowDelete] = useState(false);
    const { loading, data } = useQuery<Scene>(SceneQuery, {
        variables: { id }
    });
    const [
        deleteScene,
        { loading: deleting }
    ] = useMutation<DeleteSceneMutation, DeleteSceneMutationVariables>(DeleteScene);
    const auth = useContext(AuthContext);

    if (loading)
        return <LoadingIndicator message="Loading scene..." />;
    const scene = data.findScene;

    const toggleModal = () => setShowDelete(true);
    const handleDelete = (status:boolean):void => {
        if (status)
            deleteScene({ variables: { input: { id: scene.id } } }).then(() => history.push('/scenes'));
        setShowDelete(false);
    };

    const performers = data.findScene.performers.map((performance) => {
        const { performer } = performance;
        return (
            <Link key={performer.id} to={`/performers/${performer.id}`} className="scene-performer">
                <GenderIcon gender={performer.gender} />
                { performance.as ? `${performance.as} (${performer.name})` : performer.name }
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
                        <Link to={`${id}/edit`}>
                            <button type="button" className="btn btn-secondary">Edit</button>
                        </Link>
                        { deleteButton }
                    </div>
                    <h2>{scene.title}</h2>
                    <h6>
                        <Link to={`/studios/${scene.studio.id}`}>{scene.studio.name}</Link>
                        {' '}
•
                        {' '}
                        { scene.date}
                    </h6>
                </Card.Header>
                <Card.Body className="scene-photo">
                    <img alt="" src={getUrlByType(scene.urls, 'PHOTO')} className="scene-photo-element" />
                </Card.Body>
                <Card.Footer>
                    <div className="scene-performers">{ performers }</div>
                </Card.Footer>
            </Card>
            <div className="scene-description">
                <h2>Description:</h2>
                <div>{scene.details}</div>
                <hr />
                <a href={getUrlByType(scene.urls, 'STUDIO')}>{getUrlByType(scene.urls, 'STUDIO')}</a>
            </div>
        </>
    );
};

export default SceneComponent;
