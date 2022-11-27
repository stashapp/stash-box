import { FC } from "react";
import { Route, Routes, useParams } from "react-router-dom";

import { useUser } from "src/graphql";
import Title from "src/components/title";
import { ErrorMessage, LoadingIndicator } from "src/components/fragments";
import { isPrivateUser } from "src/utils";

import Users from "./Users";
import User from "./User";
import UserAdd from "./UserAdd";
import UserEdit from "./UserEdit";
import UserPassword from "./UserPassword";
import UserEdits from "./UserEdits";
import UserScenes from "./UserScenes";

const UserLoader: FC = () => {
  const { name } = useParams<{ name: string }>();
  const { data, loading, refetch } = useUser({ name: name ?? "" });

  if (!name) return <ErrorMessage error="Tag ID is missing" />;

  if (loading) return <LoadingIndicator message="Loading user..." />;

  const user = data?.findUser;
  if (!user) return <ErrorMessage error="User not found." />;

  return (
    <Routes>
      <Route
        path="/"
        element={
          <>
            <Title page={user.name} />
            <User user={user} refetch={refetch} />
          </>
        }
      />
      <Route
        path="/edit"
        element={
          <>
            <Title page={`Edit ${user.name}`} />
            <UserEdit user={user} />
          </>
        }
      />
      <Route
        path="/edits"
        element={
          <>
            <Title page={`Edits by ${user.name}`} />
            <UserEdits user={user} isPrivateUser={isPrivateUser(user)} />
          </>
        }
      />
    </Routes>
  );
};

const UserRoutes: FC = () => (
  <Routes>
    <Route
      path="/"
      element={
        <>
          <Title page="Users" />
          <Users />
        </>
      }
    />
    <Route
      path="/add"
      element={
        <>
          <Title page="Add User" />
          <UserAdd />
        </>
      }
    />
    <Route
      path="/change-password"
      element={
        <>
          <Title page="Change Password" />
          <UserPassword />
        </>
      }
    />
    <Route path="/scenes">
      <>
        <Title page={`My Scenes`} />
        <UserScenes />
      </>
    </Route>
    <Route path="/:name/*" element={<UserLoader />} />
  </Routes>
);

export default UserRoutes;
