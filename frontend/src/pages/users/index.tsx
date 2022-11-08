import { FC } from "react";
import { Route, Switch, useParams } from "react-router-dom";

import { useUser } from "src/graphql";
import Title from "src/components/title";
import {
  ROUTE_USERS,
  ROUTE_USER,
  ROUTE_USER_ADD,
  ROUTE_USER_EDIT,
  ROUTE_USER_PASSWORD,
  ROUTE_USER_EDITS,
} from "src/constants/route";
import { ErrorMessage, LoadingIndicator } from "src/components/fragments";
import { isPrivateUser } from "src/utils";

import Users from "./Users";
import User from "./User";
import UserAdd from "./UserAdd";
import UserEdit from "./UserEdit";
import UserPassword from "./UserPassword";
import UserEdits from "./UserEdits";

const UserLoader: FC = () => {
  const { name } = useParams<{ name: string }>();
  const { data, loading, refetch } = useUser({ name: name ?? "" });

  if (!name) return <ErrorMessage error="Tag ID is missing" />;

  if (loading) return <LoadingIndicator message="Loading user..." />;

  const user = data?.findUser;
  if (!user) return <ErrorMessage error="User not found." />;

  return (
    <Switch>
      <Route exact path={ROUTE_USER}>
        <>
          <Title page={user.name} />
          <User user={user} refetch={refetch} />
        </>
      </Route>
      <Route exact path={ROUTE_USER_EDIT}>
        <>
          <Title page={`Edit ${user.name}`} />
          <UserEdit user={user} />
        </>
      </Route>
      <Route exact path={ROUTE_USER_EDITS}>
        <>
          <Title page={`Edits by ${user.name}`} />
          <UserEdits user={user} isPrivateUser={isPrivateUser(user)} />
        </>
      </Route>
    </Switch>
  );
};

const UserRoutes: FC = () => (
  <Switch>
    <Route exact path={ROUTE_USERS}>
      <>
        <Title page="Users" />
        <Users />
      </>
    </Route>
    <Route exact path={ROUTE_USER_ADD}>
      <>
        <Title page="Add User" />
        <UserAdd />
      </>
    </Route>
    <Route exact path={ROUTE_USER_PASSWORD}>
      <>
        <Title page="Change Password" />
        <UserPassword />
      </>
    </Route>
    <Route path={ROUTE_USER}>
      <UserLoader />
    </Route>
  </Switch>
);

export default UserRoutes;
