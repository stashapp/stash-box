import React from 'react';
import { useQuery } from '@apollo/react-hooks';
import ScenesQuery from 'src/queries/Scenes.gql';
import { Scenes } from 'src/definitions/Scenes';

import { usePagination } from 'src/hooks';
import Pagination from 'src/components/pagination';
import SceneCard from 'src/components/sceneCard';
import { LoadingIndicator } from 'src/components/fragments';

const ScenesComponent: React.FC = () => {
    const { page, setPage } = usePagination();
    const { loading: loadingData, data } = useQuery<Scenes>(ScenesQuery, {
        variables: { filter: { page, per_page: 20, sort: 'DATE', direction: 'DESC' } }
    });

    if (loadingData)
        return <LoadingIndicator message="Loading scenes..." />;

    const totalPages = Math.ceil(data.queryScenes.count / 20);

    const scenes = data.queryScenes.scenes.map((scene) => (
        <SceneCard key={scene.id} performance={scene} />
    ));

    return (
        <>
            <div className="row">
                <h3 className="col-4">Scenes</h3>
                <Pagination onClick={setPage} pages={totalPages} active={page} />
            </div>
            <div className="performers row">{scenes}</div>
            <div className="row">
                <Pagination onClick={setPage} pages={totalPages} active={page} />
            </div>
        </>
    );
};

export default ScenesComponent;
