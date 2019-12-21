import React from 'react';
import { useQuery, useMutation } from '@apollo/react-hooks';
import { useHistory, useParams } from 'react-router-dom';
import UpdateStudioMutation from 'src/mutations/UpdateStudio.gql';
import { UpdateStudioMutationVariables } from 'src/definitions/UpdateStudioMutation';

import { Studio } from 'src/definitions/Studio';
import StudioQuery from 'src/queries/Studio.gql';
import { StudioCreateInput } from 'src/definitions/globalTypes';

import { LoadingIndicator } from '../fragments';
import StudioForm from '../studioForm';

const StudioEdit: React.FC = () => {
    const { id } = useParams();
    const history = useHistory();
    const { loading, data } = useQuery<Studio>(StudioQuery, {
        variables: { id }
    });
    const [updateStudio] = useMutation<Studio, UpdateStudioMutationVariables>(UpdateStudioMutation, {
        onCompleted: () => {
            history.push(`/studios/${data.findStudio.id}`);
        }
    });

    const doUpdate = (updateData:StudioCreateInput) => {
        const createData = {
            ...updateData,
            id
        };
        updateStudio({ variables: { input: createData } });
    };

    if (loading)
        return <LoadingIndicator message="Loading studio..." />;

    return (
        <div>
            <h2>
                Edit
                <strong className="ml-2">{data.findStudio.name}</strong>
            </h2>
            <hr />
            <StudioForm studio={data.findStudio} callback={doUpdate} />
        </div>
    );
};

export default StudioEdit;
