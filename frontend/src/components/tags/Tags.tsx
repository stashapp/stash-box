import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@apollo/react-hooks';
import TagsQuery from 'src/queries/Tags.gql';
import { Tags } from 'src/definitions/Tags';

import { Button } from 'react-bootstrap';
import { LoadingIndicator } from 'src/components/fragments';

const TagsComponent: React.FC = () => {
    const { loading, data } = useQuery<Tags>(TagsQuery, {
        variables: { filter: { per_page: 10000, sort: 'name', direction: 'ASC' } }
    });

    if (loading)
        return <LoadingIndicator message="Loading scenes..." />;

    const tags = data.queryTags.tags.map((tag) => (
        <li key={tag.id}>
            <Link to={`/tags/${tag.name}`}>
                { tag.name }
            </Link>
            <span className="ml-2">{ tag.description }</span>
        </li>
    ));

    return (
        <>
            <div className="row">
                <h3 className="col-4">Tags</h3>
                <Link to="/tags/add" className="ml-auto">
                    <Button>Create</Button>
                </Link>
            </div>
            <ul>{tags}</ul>
        </>
    );
};

export default TagsComponent;
