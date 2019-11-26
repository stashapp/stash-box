import React from 'react';
import { useQuery } from '@apollo/react-hooks';
import { Card } from 'react-bootstrap';
import { RouteComponentProps, Link } from '@reach/router';

import { Studios } from 'src/definitions/Studios';
import StudiosQuery from 'src/queries/Studios.gql';

import { LoadingIndicator } from 'src/components/fragments';

const StudiosComponent: React.FC<RouteComponentProps> = () => {
    const { loading: loadingData, data } = useQuery<Studios>(StudiosQuery, {
        variables: { skip: 0, limit: 1000 }
    });

    if (loadingData)
        return <LoadingIndicator message="Loading studios..." />;


    const studios = data.getStudios;

    const studioList = studios.map((studio) => (
        <li key={studio.uuid}>
            <Link to={`/studio/${studio.uuid}`}>{studio.title}</Link>
            {' '}
•
            <a href={studio.url}>{studio.url}</a>
        </li>
    ));

    return (
        <Card>
            <Card.Header>
                <h2>Studios</h2>
            </Card.Header>
            <Card.Body>
                <ul>{studioList}</ul>
            </Card.Body>
        </Card>
    );
};

export default StudiosComponent;
