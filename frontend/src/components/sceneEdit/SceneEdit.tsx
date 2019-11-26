import React from 'react';
import { useQuery, useMutation } from '@apollo/react-hooks';
import { RouteComponentProps, navigate } from '@reach/router';

import UpdateSceneMutation from 'src/mutations/UpdateScene.gql';
import { Scene } from 'src/definitions/Scene';
import SceneQuery from 'src/queries/Scene.gql';
import { SceneFormData, Performer } from 'src/common/types';

import { LoadingIndicator } from 'src/components/fragments';
import SceneForm from 'src/components/sceneForm';

interface SceneProps extends RouteComponentProps<{
    id: string;
}> {}

const SceneEdit: React.FC<SceneProps> = ({ id }) => {
    const { loading, data } = useQuery<Scene>(SceneQuery, {
        variables: { id }
    });
    const [updateScene] = useMutation<Scene>(UpdateSceneMutation, {
        onCompleted: () => {
            navigate(`/scene/${data.getScene.uuid}`);
        }
    });

    const doUpdate = (updateData:SceneFormData, performers:Performer[] = []) => {
        updateScene({ variables: { sceneId: data.getScene.id, sceneData: updateData, performers } });
    };

    if (loading)
        return <LoadingIndicator message="Loading studio..." />;

    return (
        <div>
            <h2>
                Edit
                <i>{data.getScene.title}</i>
            </h2>
            <hr />
            <SceneForm scene={data.getScene} callback={doUpdate} />
        </div>
    );
};

export default SceneEdit;
