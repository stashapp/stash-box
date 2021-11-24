import { FC, useContext } from "react";
import { Button } from "react-bootstrap";
import { Link, useHistory } from "react-router-dom";
import querystring from "query-string";

import { CriterionModifier } from "src/graphql";
import { canEdit, createHref } from "src/utils";
import AuthContext from "src/AuthContext";
import { SceneList } from "src/components/list";
import { ROUTE_SCENE_ADD } from "src/constants/route";

const Scenes: FC = () => {
  const auth = useContext(AuthContext);
  const history = useHistory();
  const queries = querystring.parse(history.location.search);
  const fingerprint = Array.isArray(queries.fingerprint)
    ? queries.fingerprint[0]
    : queries.fingerprint;
  const filter = fingerprint
    ? {
        fingerprints: {
          modifier: CriterionModifier.INCLUDES,
          value: [fingerprint],
        },
      }
    : undefined;

  return (
    <>
      <div className="d-flex">
        <h3 className="me-4">Scenes</h3>
        {canEdit(auth.user) && (
          <Link to={createHref(ROUTE_SCENE_ADD)} className="ms-auto">
            <Button>Create</Button>
          </Link>
        )}
      </div>
      <SceneList filter={filter} />
    </>
  );
};

export default Scenes;
