import { getRouteApi, Link } from "@tanstack/react-router";
import type { FC } from "react";
import { Button } from "react-bootstrap";
import SceneList from "src/components/list/SceneList";
import Title from "src/components/title";
import { ROUTE_SCENE_ADD } from "src/constants/route";
import { CriterionModifier, useConfig } from "src/graphql";
import { useCurrentUser } from "src/hooks";

const routeApi = getRouteApi("/narrow/scenes/");

const Scenes: FC = () => {
  const params = routeApi.useSearch();
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
