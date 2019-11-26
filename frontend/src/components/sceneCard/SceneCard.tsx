import React from 'react';
import { Link } from '@reach/router';
import { Card } from 'react-bootstrap';

import { Performer_getPerformer_performances as Performance } from 'src/definitions/Performer';

const SceneCard: React.FC<{performance: Performance}> = ({ performance }) => (
    <div className="col-3 scene-card">
        <Card>
            <Card.Header>
                <Link to={`/studio/${performance.studio.uuid}`}>
                    <h5>{ performance.studio.title }</h5>
                </Link>
            </Card.Header>
            <Card.Body>
                <Link to={`/scene/${performance.uuid}`}>
                    <img alt="" src={performance.photoUrl} style={{ width: '100%' }} />
                </Link>
            </Card.Body>
            <Card.Footer>
                <Link to={`/scene/${performance.uuid}`}><h6>{performance.title}</h6></Link>
                <strong>{performance.date}</strong>
            </Card.Footer>
        </Card>
    </div>
);

export default SceneCard;
