import React from 'react';
import { useMutation } from '@apollo/react-hooks';
import { useHistory } from 'react-router-dom';

import { AddStudioMutation as AddStudio } from 'src/definitions/AddStudioMutation';
import { Studio_findStudio as Studio } from 'src/definitions/Studio';
import AddStudioMutation from 'src/mutations/AddStudio.gql';
import { StudioCreateInput } from 'src/definitions/globalTypes';

import StudioForm from 'src/components/studioForm';

const StudioAdd: React.FC = () => {
    const history = useHistory();
    const [insertStudio] = useMutation<AddStudio>(AddStudioMutation, {
        onCompleted: (data) => {
            history.push(`/studios/${data.studioCreate.id}`);
        }
    });

    const doInsert = (insertData:StudioCreateInput) => {
        insertStudio({ variables: { studioData: insertData } });
    };

    const emptyStudio = {
        id: '',
        name: '',
        urls: null
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
