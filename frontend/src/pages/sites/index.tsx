import { FC } from "react";
import { Route, Switch, useParams } from "react-router-dom";

import { useSite } from "src/graphql";
import {
  ROUTE_SITE,
  ROUTE_SITE_ADD,
  ROUTE_SITE_EDIT,
  ROUTE_SITES,
} from "src/constants/route";
import { ErrorMessage, LoadingIndicator } from "src/components/fragments";
import Title from "src/components/title";

import Site from "./Site";
import Sites from "./Sites";
import SiteAdd from "./SiteAdd";
import SiteEdit from "./SiteEdit";

const SiteLoader: FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data, loading } = useSite({ id });

  if (loading) return <LoadingIndicator message="Loading site..." />;

  if (!id) return <ErrorMessage error="Site ID is missing" />;

  const site = data?.findSite;
  if (!site) return <ErrorMessage error="Site not found." />;

  return (
    <Switch>
      <Route exact path={ROUTE_SITE_EDIT}>
        <>
          <Title page={`Edit Site "${site.name}"`} />
          <SiteEdit site={site} />
        </>
      </Route>
      <Route exact path={ROUTE_SITE}>
        <>
          <Title page={`Site "${site.name}"`} />
          <Site site={site} />
        </>
      </Route>
    </Switch>
  );
};

const SiteRoutes: FC = () => (
  <Switch>
    <Route exact path={ROUTE_SITES}>
      <>
        <Title page="Sites" />
        <Sites />
      </>
    </Route>
    <Route exact path={ROUTE_SITE_ADD}>
      <>
        <Title page="Add Site" />
        <SiteAdd />
      </>
    </Route>
    <Route path={ROUTE_SITE}>
      <SiteLoader />
    </Route>
  </Switch>
);

export default SiteRoutes;
