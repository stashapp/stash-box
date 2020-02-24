import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from 'react-bootstrap';
import { Icon } from 'src/components/fragments';

import { Scenes_queryScenes_scenes as Performance } from 'src/definitions/Scenes';
import { getUrlByType } from 'src/utils/transforms';

const CLASSNAME = 'SceneCard';
const CLASSNAME_IMAGE = `${CLASSNAME}-image`;
const CLASSNAME_TITLE = `${CLASSNAME}-title`;
const CLASSNAME_BODY = `${CLASSNAME}-body`;

const formatDuration = (dur?: number) => {
    if (!dur) return '';
    let value = dur;
    let hour = 0;
    let minute = 0;
    let seconds = 0;
    if (value >= 3600) {
        hour = Math.floor(value / 3600);
        value -= (hour * 3600);
    }
    minute = Math.floor(value / 60);
    value -= minute * 60;
    seconds = value;

    const res = [
        minute.toString().padStart(2, '0'),
        seconds.toString().padStart(2, '0')
    ];
    if (hour)
        res.push(hour.toString());
    return res.join(':');
};

const SceneCard: React.FC<{performance: Performance}> = ({ performance }) => (
    <div className={`col-3 ${CLASSNAME}`}>
        <Card>
            <Card.Body className={CLASSNAME_BODY}>
                <Link to={`/scenes/${performance.id}`} className={CLASSNAME_IMAGE}>
                    <img alt="" src={getUrlByType(performance.urls, 'PHOTO', 'landscape')} />
                </Link>
            </Card.Body>
            <Card.Footer>
                <Link to={`/scenes/${performance.id}`} className="d-flex">
                    <h6 className={CLASSNAME_TITLE}>{performance.title}</h6>
                    <span className="text-muted">{formatDuration(performance.duration)}</span>
                </Link>
                <div>
                    <Link to={`/studios/${performance.studio.id}`} className="float-right text-muted">
                        <Icon icon="video" className="mr-1" />
                        { performance.studio.name }
                    </Link>
                    <strong className="text-muted">{performance.date}</strong>
                </div>
            </Card.Footer>
        </Card>
    </div>
);

export default SceneCard;
