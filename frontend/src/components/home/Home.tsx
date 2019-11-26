import React from 'react';
import { useQuery } from '@apollo/react-hooks';
import { RouteComponentProps, Link } from '@reach/router';
import { Card } from 'react-bootstrap';

import ScenesQuery from 'src/queries/Scenes.gql';
import PerformersQuery from 'src/queries/Performers.gql';
import { Scenes } from 'src/definitions/Scenes';
import { Performers } from 'src/definitions/Performers';

import SceneCard from 'src/components/sceneCard';
import { LoadingIndicator } from 'src/components/fragments';


const ScenesComponent: React.FC<RouteComponentProps> = () => {
    const { loading: loadingScenes, data: sceneData } = useQuery<Scenes>(ScenesQuery, {
        variables: { skip: 0, limit: 4 }
    });
    const { loading: loadingPerformers, data: performerData } = useQuery<Performers>(PerformersQuery, {
        variables: { skip: 0, limit: 4 }
    });

    const scenes = loadingScenes
        ? <LoadingIndicator message="Loading scenes..." />
        : sceneData.getScenes.map((scene) => (
            <SceneCard key={scene.uuid} performance={scene} />
        ));

    const performers = loadingPerformers
        ? <LoadingIndicator message="Loading performers" />
        : performerData.getPerformers.map((performer) => (
            <div key={performer.uuid} className="col-12 col-lg-3 col-md-6">
                <Card>
                    <Link to={`/performer/${performer.uuid}`}>
                        <Card.Img variant="top" src="http://placekitten.com/g/200/300" />
                        <Card.Title>{performer.name}</Card.Title>
                    </Link>
                </Card>
            </div>
        ));

    return (
        <>
            <div className="scenes">
                <h4>New scenes:</h4>
                <div className="row">{scenes}</div>
            </div>
            <div className="performers">
                <h4>New performers:</h4>
                <div className="row">{performers}</div>
            </div>
        </>
    );
};

export default ScenesComponent;
