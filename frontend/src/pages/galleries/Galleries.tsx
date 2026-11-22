import type { FC } from "react";
import { Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { GalleryList } from "src/components/list";
import { ROUTE_GALLERY_ADD } from "src/constants";
import { useCurrentUser } from "src/hooks";
import { createHref } from "src/utils";

const Galleries: FC = () => {
  const { isEditor } = useCurrentUser();

  return (
    <>
      <div className="d-flex">
        <h3 className="me-4">Galleries</h3>
        {isEditor && (
          <Link to={createHref(ROUTE_GALLERY_ADD)} className="ms-auto">
            <Button>Create</Button>
          </Link>
        )}
      </div>
      <GalleryList />
    </>
  );
};

export default Galleries;
