import React from 'react';
import { Pagination } from 'react-bootstrap';

interface PaginationProps {
    active: number;
    pages: number;
    onClick: (page:number) => void;
}

const PaginationComponent: React.FC<PaginationProps> = ({ active, pages, onClick }) => {
    const showFirst = pages > 5 && active > 3;
    const showLast = pages > 5 && active < (pages - 3);

    const maxVal = Math.max(Math.min(active + 2, pages), Math.min(pages, 5));
    const minVal = Math.max(maxVal - 4, 1);
    const totalItems = maxVal - minVal + 1;

    const paginationItems = [...Array(totalItems)].map((_, arrayIndex) => {
        const index = arrayIndex + minVal;
        const isActive = active === index;
        return <Pagination.Item key={index} data-page={index} active={isActive}>{index}</Pagination.Item>;
    });

    const handleClick = (e:React.MouseEvent<HTMLUListElement>):void => {
        const pageNumber = Number.parseInt((e.target as HTMLAnchorElement).closest('a').dataset.page, 10);
        if (pageNumber !== active)
            onClick(pageNumber);
    };

    return (
        <Pagination onClick={handleClick}>
            { showFirst && <Pagination.First data-page={1} /> }
            <Pagination.Prev disabled={active === 1} data-page={active - 1} />
            { paginationItems }
            <Pagination.Next disabled={active === pages} data-page={active + 1} />
            { showLast && <Pagination.Last data-page={pages} /> }
        </Pagination>
    );
};

export default PaginationComponent;
