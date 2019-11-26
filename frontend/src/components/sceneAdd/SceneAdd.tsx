import React from 'react';
import { useMutation } from '@apollo/react-hooks';
import { RouteComponentProps, navigate } from '@reach/router';

import { Scene_getScene as Scene } from 'src/definitions/Scene';
import { AddSceneMutation as NewScene } from 'src/definitions/AddSceneMutation';
import AddSceneMutation from 'src/mutations/AddScene.gql';

import { SceneFormData, Performer } from 'src/common/types';
import SceneForm from 'src/components/sceneForm';

const SceneAdd: React.FC<RouteComponentProps> = () => {
    const [insertScene] = useMutation<NewScene>(AddSceneMutation, {
        onCompleted: (data) => {
            navigate(`/scene/${data.addScene.uuid}`);
        }
    });

    const doInsert = (insertData:SceneFormData, performers:Performer[]) => {
        insertScene({ variables: { sceneData: insertData, performers } });
    };

    const emptyScene = {
        id: null,
        uuid: null,
        title: null,
        date: null,
        dateAccuracy: null,
        photoUrl: null,
        description: null,
        studioUrl: null,
        studio: {
            id: null
        },
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
