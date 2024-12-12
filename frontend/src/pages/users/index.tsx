import { FC } from "react";
import { Route, Routes, useParams } from "react-router-dom";

import { useUser } from "src/graphql";
import Title from "src/components/title";
import { ErrorMessage, LoadingIndicator } from "src/components/fragments";

import Users from "./Users";
import User from "./User";
import UserAdd from "./UserAdd";
import UserEdit from "./UserEdit";
import UserPassword from "./UserPassword";
import UserEdits from "./UserEdits";
import UserConfirmChangeEmail from "./UserConfirmChangeEmail";
import UserValidateChangeEmail from "./UserValidateChangeEmail";
import UserFingerprints from "./UserFingerprints";

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
            <UserEdits user={user} />
          </>
        }
      />
      <Route
        path="/confirm-email"
        element={<UserConfirmChangeEmail user={user} />}
      />
      <Route
        path="/change-email"
        element={<UserValidateChangeEmail user={user} />}
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
    <Route
      path="/fingerprints"
      element={
        <>
          <Title page={"My Fingerprints"} />
          <UserFingerprints />
        </>
      }
    />
    <Route path="/:name/*" element={<UserLoader />} />
  </Routes>
);

export default UserRoutes;
