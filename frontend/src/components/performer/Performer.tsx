import React from 'react';
import { useQuery } from '@apollo/react-hooks';
import { RouteComponentProps } from '@reach/router';

import { Performer } from 'src/definitions/Performer';
import PerformerQuery from 'src/queries/Performer.gql';

import PerformerCard from 'src/components/performerCard';
import SceneCard from 'src/components/sceneCard';
import { LoadingIndicator } from 'src/components/fragments';

interface PerformerProps extends RouteComponentProps<{
    id: string;
}> {}

const PerformerComponent: React.FC<PerformerProps> = ({ id }) => {
    const { loading, data } = useQuery<Performer>(PerformerQuery, {
        variables: { id }
    });

    if (loading)
        return <LoadingIndicator message="Loading performer..." />;

    const scenes = data.getPerformer.performances.sort(
        (a, b) => {
            if (a.date < b.date) return 1;
            if (a.date > b.date) return -1;
            return -1;
        }
    ).map((p) => (<SceneCard key={p.uuid} performance={p} />));

    return (
        <>
            <div className="performer-info">
                <PerformerCard performer={data.getPerformer} />
            </div>
            <hr />
            <div className="row performer-scenes">
                { scenes }
            </div>
        </>
    );
};

export default PerformerComponent;
