import React from 'react';
import { useQuery } from '@apollo/react-hooks';
import { Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import { Studios } from 'src/definitions/Studios';
import StudiosQuery from 'src/queries/Studios.gql';

import { LoadingIndicator } from 'src/components/fragments';

const StudiosComponent: React.FC = () => {
    const { loading: loadingData, data } = useQuery<Studios>(StudiosQuery, {
        variables: { filter: { page: 0, per_page: 10000 } }
    });

    if (loadingData)
        return <LoadingIndicator message="Loading studios..." />;

    const studioList = data.queryStudios.studios.map((studio) => (
        <li key={studio.id}>
            <Link to={`/studios/${studio.id}`}>{studio.name}</Link>
            {' '}
•
            { studio.urls.filter((url) => url.type === 'HOME').map((url) => (
                <a href={url.url}>{url.url}</a>
            ))}
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
