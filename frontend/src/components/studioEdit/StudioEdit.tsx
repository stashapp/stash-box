import React from 'react';
import { useQuery, useMutation } from '@apollo/react-hooks';
import { RouteComponentProps, navigate } from '@reach/router';
import UpdateStudioMutation from 'src/mutations/UpdateStudio.gql';

import { Studio } from 'src/definitions/Studio';
import StudioQuery from 'src/queries/Studio.gql';

import { LoadingIndicator } from '../fragments';
import StudioForm from '../studioForm';

interface StudioProps extends RouteComponentProps<{
    id: string;
}> {}

const StudioEdit: React.FC<StudioProps> = ({ id }) => {
    const { loading, data } = useQuery<Studio>(StudioQuery, {
        variables: { id }
    });
    const [updateStudio] = useMutation<Studio>(UpdateStudioMutation, {
        onCompleted: () => {
            navigate(`/studio/${data.getStudio.uuid}`);
        }
    });

    const doUpdate = (updateData:Object) => {
        updateStudio({ variables: { studioId: data.getStudio.id, studioData: updateData } });
    };

    if (loading)
        return <LoadingIndicator message="Loading studio..." />;

    return (
        <div>
            <h2>
                Edit
                <i>{data.getStudio.title}</i>
            </h2>
            <hr />
            <StudioForm studio={data.getStudio} callback={doUpdate} />
        </div>
    );
};

export default StudioEdit;
