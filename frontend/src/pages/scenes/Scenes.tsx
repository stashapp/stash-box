import { Link, Outlet } from "@tanstack/react-router";
import type { FC } from "react";
import { Button } from "react-bootstrap";
import { SceneListFilters } from "src/components/list/SceneListFilters";
import Title from "src/components/title";
import { ROUTE_SCENE_ADD } from "src/constants/route";
import { useConfig } from "src/graphql";
import { useCurrentUser } from "src/hooks";

const Scenes: FC = () => {
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
      <div className="d-flex flex-wrap gap-2">
        <SceneListFilters favoriteFilter="all" />
      </div>
      <Outlet />
    </>
  );
};

export default Scenes;
