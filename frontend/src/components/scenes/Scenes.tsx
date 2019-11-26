import React, { useState } from 'react';
import { useQuery } from '@apollo/react-hooks';
import { RouteComponentProps } from '@reach/router';
import ScenesQuery from 'src/queries/Scenes.gql';
import SceneCountQuery from 'src/queries/SceneCount.gql';
import { Scenes } from 'src/definitions/Scenes';
import { SceneCount } from 'src/definitions/SceneCount';

import Pagination from 'src/components/pagination';
import SceneCard from 'src/components/sceneCard';
import { LoadingIndicator } from 'src/components/fragments';


const ScenesComponent: React.FC<RouteComponentProps> = () => {
    const [page, setPage] = useState(1);
    const { loading: loadingData, data } = useQuery<Scenes>(ScenesQuery, {
        variables: { skip: (20 * page) - 20, limit: 20 }
    });
    const { loading: loadingTotal, data: countData } = useQuery<SceneCount>(SceneCountQuery);

    if (loadingTotal || loadingData)
        return <LoadingIndicator message="Loading scenes..." />;

    const handlePagination = (pageNumber:number) => setPage(pageNumber);
    const totalPages = Math.ceil(countData.sceneCount / 20);

    const scenes = data.getScenes.map((scene) => (
        <SceneCard key={scene.uuid} performance={scene} />
    ));

    return (
        <>
            <div className="row">
                <h3 className="col-4">Scenes</h3>
                <Pagination onClick={handlePagination} pages={totalPages} active={page} />
            </div>
            <div className="performers row">{scenes}</div>
            <div className="row">
                <Pagination onClick={handlePagination} pages={totalPages} active={page} />
            </div>
        </>
    );
};

export default ScenesComponent;
