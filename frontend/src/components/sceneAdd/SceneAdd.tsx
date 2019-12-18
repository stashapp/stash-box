import React from 'react';
import { useMutation } from '@apollo/react-hooks';
import { useHistory } from 'react-router-dom';

import { Scene_findScene as Scene } from 'src/definitions/Scene';
import { AddSceneMutation as AddScene, AddSceneMutationVariables } from 'src/definitions/AddSceneMutation';
import AddSceneMutation from 'src/mutations/AddScene.gql';
import { SceneUpdateInput, SceneCreateInput } from 'src/definitions/globalTypes';

import SceneForm from 'src/components/sceneForm';

const SceneAdd: React.FC = () => {
    const history = useHistory();
    const [insertScene] = useMutation<AddScene, AddSceneMutationVariables>(AddSceneMutation, {
        onCompleted: (data) => {
            history.push(`/scenes/${data.sceneCreate.id}`);
        }
    });

    const doInsert = (updateData:SceneUpdateInput) => {
        const { id, ...sceneData } = updateData;
        const insertData:SceneCreateInput = { ...sceneData, fingerprints: updateData.fingerprints || [] };
        insertScene({ variables: { sceneData: insertData } });
    };

    const emptyScene = {
        id: '',
        date: null,
        title: null,
        details: null,
        urls: null,
        studio: null,
        tag_ids: null,
        fingerprints: [],
        performers: []
    } as Scene;

    return (
        <div>
            <h2>Add new scene</h2>
            <hr />
            <SceneForm scene={emptyScene} callback={doInsert} />
        </div>
    );
};

export default SceneAdd;
