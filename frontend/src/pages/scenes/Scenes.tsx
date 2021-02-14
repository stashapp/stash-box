import React, { useContext } from "react";
import { Button } from "react-bootstrap";
import { Link } from "react-router-dom";

import { canEdit } from "src/utils/auth";
import AuthContext from "src/AuthContext";
import { SceneList } from "src/components/list";

const Scenes: React.FC = () => {
  const auth = useContext(AuthContext);

  return (
    <>
      <div className="d-flex">
        <h3 className="mr-4">Scenes</h3>
        {canEdit(auth.user) && (
          <Link to="/scenes/add" className="ml-auto">
            <Button>Create</Button>
          </Link>
        )}
      </div>
      <SceneList />
    </>
  );
};

export default Scenes;
