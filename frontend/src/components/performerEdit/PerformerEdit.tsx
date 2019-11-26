import React from 'react';
import { useQuery, useMutation } from '@apollo/react-hooks';
import { RouteComponentProps, navigate } from '@reach/router';

import UpdatePerformerMutation from 'src/mutations/UpdatePerformer.gql';
import PerformerQuery from 'src/queries/Performer.gql';
import { Performer } from 'src/definitions/Performer';

import { LoadingIndicator } from 'src/components/fragments';
import PerformerForm from 'src/components/performerForm';

interface PerformerProps extends RouteComponentProps<{
    id: string;
}> {}

const PerformerEdit: React.FC<PerformerProps> = ({ id }) => {
    const { loading, data } = useQuery<Performer>(PerformerQuery, {
        variables: { id }
    });
    const [updatePerformer] = useMutation<Performer>(UpdatePerformerMutation, {
        onCompleted: () => {
            navigate(`/performer/${data.getPerformer.uuid}`);
        }
    });

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const doUpdate = (updateData:any) => {
        updatePerformer({ variables: { performerId: data.getPerformer.id, performerData: updateData } });
    };

    if (loading)
        return <LoadingIndicator message="Loading performer..." />;

    return (
        <div>
            <h2>
                Edit
                <i>{data.getPerformer.name}</i>
            </h2>
            <hr />
            <PerformerForm performer={data.getPerformer} callback={doUpdate} />
        </div>
    );
};

export default PerformerEdit;
