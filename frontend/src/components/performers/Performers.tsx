import React, { useState } from 'react';
import { useQuery } from '@apollo/react-hooks';
import { Card } from 'react-bootstrap';
import { RouteComponentProps, Link } from '@reach/router';

import PerformersQuery from 'src/queries/Performers.gql';
import PerformerCountQuery from 'src/queries/PerformerCount.gql';
import { Performers } from 'src/definitions/Performers';
import { PerformerCount } from 'src/definitions/PerformerCount';

import Pagination from 'src/components/pagination';
import { LoadingIndicator } from 'src/components/fragments';

const PerformersComponent: React.FC<RouteComponentProps> = () => {
    const [page, setPage] = useState(1);
    const { loading: loadingData, data } = useQuery<Performers>(PerformersQuery, {
        variables: { skip: (20 * page) - 20, limit: 20 }
    });
    const { loading: loadingTotal, data: countData } = useQuery<PerformerCount>(PerformerCountQuery);

    if (loadingTotal)
        return <LoadingIndicator message="Loading performers..." />;

    const handlePagination = (pageNumber:number) => setPage(pageNumber);
    const totalPages = Math.ceil(countData.performerCount / 20);

    const performers = loadingData ? <div>Loading performers...</div> : data.getPerformers.map((performer) => (
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
            <div className="row">
                <h3 className="col-4">Performers</h3>
                <Pagination onClick={handlePagination} pages={totalPages} active={page} />
            </div>
            <div className="performers row">{performers}</div>
            <div className="row">
                <Pagination onClick={handlePagination} pages={totalPages} active={page} />
            </div>
        </>
    );
};

export default PerformersComponent;
