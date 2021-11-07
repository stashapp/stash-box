import { FC } from "react";
import { Route, Switch, useParams } from "react-router-dom";

import { ErrorMessage, LoadingIndicator } from "src/components/fragments";

import { useStudio } from "src/graphql";
import Title from "src/components/title";
import {
  ROUTE_STUDIO,
  ROUTE_STUDIO_ADD,
  ROUTE_STUDIOS,
  ROUTE_STUDIO_EDIT,
  ROUTE_STUDIO_DELETE,
} from "src/constants/route";

import Studio from "./Studio";
import Studios from "./Studios";
import StudioEdit from "./StudioEdit";
import StudioAdd from "./StudioAdd";
import StudioDelete from "./StudioDelete";

const StudioLoader: FC = () => {
  const { id } = useParams<{ id: string }>();
  const { loading, data } = useStudio({ id });

  if (loading) return <LoadingIndicator message="Loading studio..." />;

  if (!id) return <ErrorMessage error="Studio ID is missing" />;

  const studio = data?.findStudio;
  if (!studio) return <ErrorMessage error="Studio not found." />;

  return (
    <Switch>
      <Route exact path={ROUTE_STUDIO_DELETE}>
        <>
          <Title page={`Delete "${studio.name}"`} />
          <StudioDelete studio={studio} />
        </>
      </Route>
      <Route exact path={ROUTE_STUDIO_EDIT}>
        <>
          <Title page={`Edit "${studio.name}"`} />
          <StudioEdit studio={studio} />
        </>
      </Route>
      <Route exact path={ROUTE_STUDIO}>
        <>
          <Title page={studio.name} />
          <Studio studio={studio} />
        </>
      </Route>
    </Switch>
  );
};

const SceneRoutes: FC = () => (
  <Switch>
    <Route exact path={ROUTE_STUDIO_ADD}>
      <>
        <Title page="Add Studio" />
        <StudioAdd />
      </>
    </Route>
    <Route exact path={ROUTE_STUDIOS}>
      <>
        <Title page="Studios" />
        <Studios />
      </>
    </Route>
    <Route path={ROUTE_STUDIO}>
      <StudioLoader />
    </Route>
  </Switch>
);

export default SceneRoutes;
