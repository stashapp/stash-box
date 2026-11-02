import { Link } from "@tanstack/react-router";
import type { FC } from "react";
import { Button } from "react-bootstrap";
import SceneList from "src/components/list/SceneList";
import Title from "src/components/title";
import { ROUTE_SCENE_ADD } from "src/constants/route";
import { CriterionModifier, useConfig } from "src/graphql";
import { useCurrentUser, useQueryParams } from "src/hooks";

const Scenes: FC = () => {
  const [params] = useQueryParams({
    fingerprint: { name: "fingerprint", type: "string" },
  });
  const filter = params.fingerprint
    ? {
        fingerprints: {
          value: [params.fingerprint],
          modifier: CriterionModifier.INCLUDES,
        },
      }
    : undefined;
  const { isEditor } = useCurrentUser();
  const { data: configData } = useConfig();

  return (
    <>
      <Title page="Scenes" />
      <div className="d-flex">
        <h3 className="me-4">Scenes</h3>
        {isEditor && !configData?.getConfig.require_scene_draft && (
          <Link to={ROUTE_SCENE_ADD} className="ms-auto">
            <Button>Create</Button>
          </Link>
        )}
      </div>
      <SceneList favoriteFilter="all" filter={filter} />
    </>
  );
};

export default Scenes;
