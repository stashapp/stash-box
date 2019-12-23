import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from 'react-bootstrap';

import { Scenes_queryScenes_scenes as Performance } from 'src/definitions/Scenes';
import { getUrlByType } from 'src/utils/transforms';

const CLASSNAME = 'SceneCard';
const CLASSNAME_IMAGE = `${CLASSNAME}-image`;
const CLASSNAME_TITLE = `${CLASSNAME}-title`;
const CLASSNAME_BODY = `${CLASSNAME}-body`;

const SceneCard: React.FC<{performance: Performance}> = ({ performance }) => (
    <div className={`col-3 ${CLASSNAME}`}>
        <Card>
            <Card.Header>
                <Link to={`/studios/${performance.studio.id}`}>
                    <h5>{ performance.studio.name }</h5>
                </Link>
            </Card.Header>
            <Card.Body className={CLASSNAME_BODY}>
                <Link to={`/scenes/${performance.id}`} className={CLASSNAME_IMAGE}>
                    <img alt="" src={getUrlByType(performance.urls, 'PHOTO')} />
                </Link>
            </Card.Body>
            <Card.Footer>
                <Link to={`/scenes/${performance.id}`}>
                    <h6 className={CLASSNAME_TITLE}>{performance.title}</h6>
                </Link>
                <strong>{performance.date}</strong>
            </Card.Footer>
        </Card>
    </div>
);

export default SceneCard;
