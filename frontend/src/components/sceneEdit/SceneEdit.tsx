import React from 'react';
import { useQuery, useMutation } from '@apollo/react-hooks';
import { useHistory, useParams } from 'react-router-dom';

import UpdateSceneMutation from 'src/mutations/UpdateScene.gql';
import { Scene } from 'src/definitions/Scene';
import { UpdateSceneMutationVariables } from 'src/definitions/UpdateSceneMutation';
import SceneQuery from 'src/queries/Scene.gql';
import { SceneUpdateInput } from 'src/definitions/globalTypes';

import { LoadingIndicator } from 'src/components/fragments';
import SceneForm from 'src/components/sceneForm';

const SceneEdit: React.FC = () => {
    const { id } = useParams();
    const history = useHistory();
    const { loading, data } = useQuery<Scene>(SceneQuery, {
        variables: { id }
    });
    const [updateScene] = useMutation<Scene, UpdateSceneMutationVariables>(UpdateSceneMutation, {
        onCompleted: () => {
            history.push(`/scenes/${data.findScene.id}`);
        }
    });

    const doUpdate = (updateData:SceneUpdateInput) => {
        updateScene({ variables: { updateData } });
    };

    if (loading)
        return <LoadingIndicator message="Loading studio..." />;

    return (
        <div>
            <h2>
                Edit
                <i>{data.findScene.title}</i>
            </h2>
            <hr />
            <SceneForm scene={data.findScene} callback={doUpdate} />
        </div>
    );
};

export default SceneEdit;
