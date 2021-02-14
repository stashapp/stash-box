import React, { useContext } from "react";
import { Button } from "react-bootstrap";
import { Link } from "react-router-dom";

import { canEdit, createHref } from "src/utils";
import AuthContext from "src/AuthContext";
import { SceneList } from "src/components/list";
import { ROUTE_SCENE_ADD } from "src/constants/route";

const Scenes: React.FC = () => {
  const auth = useContext(AuthContext);

  return (
    <>
      <div className="d-flex">
        <h3 className="mr-4">Scenes</h3>
        {canEdit(auth.user) && (
          <Link to={createHref(ROUTE_SCENE_ADD)} className="ml-auto">
            <Button>Create</Button>
          </Link>
        )}
      </div>
      <SceneList />
    </>
  );
};

export default Scenes;
