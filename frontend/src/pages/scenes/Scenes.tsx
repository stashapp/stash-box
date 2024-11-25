import { FC, useContext } from "react";
import { Button } from "react-bootstrap";
import { Link } from "react-router-dom";

import { CriterionModifier, useConfig } from "src/graphql";
import { canEdit, createHref } from "src/utils";
import AuthContext from "src/AuthContext";
import { SceneList } from "src/components/list";
import { useQueryParams } from "src/hooks";
import { ROUTE_SCENE_ADD } from "src/constants/route";

const Scenes: FC = () => {
  const auth = useContext(AuthContext);
  const { data: configData } = useConfig();
  const [{ fingerprint }] = useQueryParams({
    fingerprint: { name: "fingerprint", type: "string" },
  });
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
        {canEdit(auth.user) &&
          !configData?.getConfig.require_scene_draft && (
            <Link to={createHref(ROUTE_SCENE_ADD)} className="ms-auto">
              <Button>Create</Button>
            </Link>
          )}
      </div>
      <SceneList filter={filter} favoriteFilter="all" />
    </>
  );
};

export default Scenes;
