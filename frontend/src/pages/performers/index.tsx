import { FC } from "react";
import { Route, Switch, useParams } from "react-router-dom";

import { ErrorMessage, LoadingIndicator } from "src/components/fragments";

import { useFullPerformer } from "src/graphql";
import Title from "src/components/title";
import {
  ROUTE_PERFORMER,
  ROUTE_PERFORMERS,
  ROUTE_PERFORMER_ADD,
  ROUTE_PERFORMER_EDIT,
  ROUTE_PERFORMER_MERGE,
  ROUTE_PERFORMER_DELETE,
} from "src/constants/route";

import Performers from "./Performers";
import Performer from "./Performer";
import PerformerAdd from "./PerformerAdd";
import PerformerEdit from "./PerformerEdit";
import PerformerMerge from "./PerformerMerge";
import PerformerDelete from "./PerformerDelete";

const PerformerLoader: FC = () => {
  const { id } = useParams<{ id: string }>();
  const { loading, data } = useFullPerformer({ id });

  if (loading) return <LoadingIndicator message="Loading performer..." />;

  if (!id) return <ErrorMessage error="Performer ID is missing" />;

  const performer = data?.findPerformer;
  if (!performer) return <ErrorMessage error="Performer not found." />;

  return (
    <Switch>
      <Route exact path={ROUTE_PERFORMER_MERGE}>
        <>
          <Title page={`Merge Into "${performer.name}"`} />
          <PerformerMerge performer={performer} />
        </>
      </Route>
      <Route exact path={ROUTE_PERFORMER_DELETE}>
        <>
          <Title page={`Delete "${performer.name}"`} />
          <PerformerDelete performer={performer} />
        </>
      </Route>
      <Route exact path={ROUTE_PERFORMER_EDIT}>
        <>
          <Title page={`Edit "${performer.name}"`} />
          <PerformerEdit performer={performer} />
        </>
      </Route>
      <Route exact path={ROUTE_PERFORMER}>
        <>
          <Title page={performer.name} />
          <Performer performer={performer} />
        </>
      </Route>
    </Switch>
  );
};

const PerformerRoutes: FC = () => (
  <Switch>
    <Route exact path={ROUTE_PERFORMERS}>
      <>
        <Title page="Performers" />
        <Performers />
      </>
    </Route>
    <Route exact path={ROUTE_PERFORMER_ADD}>
      <>
        <Title page="Add Performer" />
        <PerformerAdd />
      </>
    </Route>
    <Route path={ROUTE_PERFORMER}>
      <PerformerLoader />
    </Route>
  </Switch>
);

export default PerformerRoutes;
