import React, { useState } from 'react';
import { useQuery } from '@apollo/react-hooks';
import { RouteComponentProps, Link } from '@reach/router';

import { Studio } from 'src/definitions/Studio';
import StudioQuery from 'src/queries/Studio.gql';

import Pagination from 'src/components/pagination';
import { LoadingIndicator } from 'src/components/fragments';
import SceneCard from 'src/components/sceneCard';

interface StudioProps extends RouteComponentProps<{
    id: string;
}> {}

const StudioComponent: React.FC<StudioProps> = ({ id }) => {
    const [page, setPage] = useState(1);
    const { loading, data } = useQuery<Studio>(StudioQuery, {
        variables: { id, skip: (40 * page) - 40, limit: 40 }
    });

    if (loading)
        return <LoadingIndicator message="Loading studio..." />;

    const studio = data.getStudio;

    const handlePagination = (pageNumber:number) => setPage(pageNumber);

    const totalPages = Math.ceil(studio.sceneCount / 40);
    const scenes = studio.scenes.sort(
        (a, b) => {
            if (a.date < b.date) return 1;
            if (a.date > b.date) return -1;
            return -1;
        }
    ).map((p) => (<SceneCard key={p.uuid} performance={p} />));

    const handleDelete = () => {
    };

    return (
        <>
            <div className="studio-header">
                <div className="studio-title">
                    <h2>{studio.title}</h2>
                    <h4><a href={studio.url}>{studio.url}</a></h4>
                </div>
                <div className="studio-photo">
                    { studio.photoUrl && <img src={studio.photoUrl} alt="Studio logo" /> }
                </div>
                <div className="studio-edit">
                    <Link to="edit">
                        <button type="button" className="btn btn-secondary">Edit</button>
                    </Link>
                    <button type="button" className="btn btn-danger" onClick={handleDelete}>Delete</button>
                </div>
            </div>
            <hr />
            <div className="row">
                <h3 className="col-4">Scenes</h3>
                <Pagination onClick={handlePagination} pages={totalPages} active={page} />
            </div>
            <div className="row">
                { scenes }
            </div>
            <div className="row">
                <Pagination onClick={handlePagination} pages={totalPages} active={page} />
            </div>
        </>
    );
};

export default StudioComponent;
