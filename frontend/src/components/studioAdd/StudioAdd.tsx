import React from 'react';
import { useMutation } from '@apollo/react-hooks';
import { RouteComponentProps, navigate } from '@reach/router';

import { Studio_getStudio as Studio } from 'src/definitions/Studio';
import { AddStudioMutation as NewStudio } from 'src/definitions/AddStudioMutation';
import AddStudioMutation from 'src/mutations/AddStudio.gql';

import StudioForm from 'src/components/studioForm';

const StudioAdd: React.FC<RouteComponentProps> = () => {
    const [insertStudio] = useMutation<NewStudio>(AddStudioMutation, {
        onCompleted: (data) => {
            navigate(`/studio/${data.addStudio.uuid}`);
        }
    });

    const doInsert = (insertData:Object) => {
        insertStudio({ variables: { studioData: insertData } });
    };

    const emptyStudio = {
        title: null,
        url: null,
        photoUrl: null
    } as Studio;

    return (
        <div>
            <h2>Add new studio</h2>
            <hr />
            <StudioForm studio={emptyStudio} callback={doInsert} />
        </div>
    );
};

export default StudioAdd;
