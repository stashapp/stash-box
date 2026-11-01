import {
  type QueryRef,
  useQueryRefHandlers,
  useReadQuery,
} from "@apollo/client/react";
import { Outlet } from "@tanstack/react-router";
import type { FC } from "react";
import { createContext, startTransition, useContext } from "react";
import { ErrorMessage } from "src/components/fragments";
import Title from "src/components/title";
import type { PublicUserQuery, UserQuery } from "src/graphql";
import { requireEntity } from "src/routing/requireEntity";
import User from "./User";
import UserAdd from "./UserAdd";
import UserConfirmChangeEmail from "./UserConfirmChangeEmail";
import UserEdit from "./UserEdit";
import UserEdits from "./UserEdits";
import UserFingerprints from "./UserFingerprints";
import { UserImageTypePreferences } from "./UserImageTypePreferences";
import { UserNotificationPreferences } from "./UserNotificationPreferences";
import UserPassword from "./UserPassword";
import Users from "./Users";
import UserValidateChangeEmail from "./UserValidateChangeEmail";

const UserContext = createContext<{
  user: NonNullable<UserQuery["findUser"] | PublicUserQuery["findUser"]>;
  refetch: () => void;
} | null>(null);
export const UserLayout = ({
  queryRef,
}: {
  queryRef: QueryRef<UserQuery | PublicUserQuery>;
}) => {
  const { data } = useReadQuery(queryRef);
  const { refetch: refetchQuery } = useQueryRefHandlers(queryRef);
  const refetch = () =>
    startTransition(() => {
      // useReadQuery sends failures to the route boundary.
      void refetchQuery().catch(() => undefined);
    });
  const user = requireEntity(data.findUser);
  return (
    <UserContext.Provider value={{ user, refetch }}>
      <Outlet />
    </UserContext.Provider>
  );
};

export const UserDetailPage: FC = () => {
  const value = useContext(UserContext);
  if (!value) throw new Error("User layout is missing");
  const { user, refetch } = value;
  return (
    <>
      <Title page={user.name} />
      <User user={user} refetch={refetch} />
    </>
  );
};

export const UserEditPage: FC = () => {
  const value = useContext(UserContext);
  if (!value) throw new Error("User layout is missing");
  const { user } = value;
  return (
    <>
      <Title page={`Edit ${user.name}`} />
      <UserEdit user={user} />
    </>
  );
};

export const UserEditsPage: FC = () => {
  const value = useContext(UserContext);
  if (!value) throw new Error("User layout is missing");
  const { user } = value;
  return (
    <>
      <Title page={`Edits by ${user.name}`} />
      <UserEdits user={user} />
    </>
  );
};

export const UserConfirmEmailPage: FC = () => {
  const value = useContext(UserContext);
  if (!value) throw new Error("User layout is missing");
  const { user } = value;
  return <UserConfirmChangeEmail user={user} />;
};

export const UserChangeEmailPage: FC = () => {
  const value = useContext(UserContext);
  if (!value) throw new Error("User layout is missing");
  const { user } = value;
  return <UserValidateChangeEmail user={user} />;
};

export const UserImageTypesPage: FC = () => {
  const value = useContext(UserContext);
  if (!value) throw new Error("User layout is missing");
  const { user } = value;
  return "image_type_preferences" in user ? (
    <>
      <Title page={"Image Preferences"} />
      <UserImageTypePreferences user={user} />
    </>
  ) : (
    <ErrorMessage error="Forbidden" />
  );
};

export const UserNotificationsPage: FC = () => {
  const value = useContext(UserContext);
  if (!value) throw new Error("User layout is missing");
  const { user } = value;
  return "notification_subscriptions" in user ? (
    <>
      <Title page={"Notification Preferences"} />
      <UserNotificationPreferences user={user} />
    </>
  ) : (
    <ErrorMessage error="Forbidden" />
  );
};

export const UserListPage: FC = () => (
  <>
    <Title page="Users" />
    <Users />
  </>
);

export const UserAddPage: FC = () => (
  <>
    <Title page="Add User" />
    <UserAdd />
  </>
);

export const UserChangePasswordPage: FC = () => (
  <>
    <Title page="Change Password" />
    <UserPassword />
  </>
);

export const UserFingerprintsPage: FC = () => (
  <>
    <Title page={"My Fingerprints"} />
    <UserFingerprints />
  </>
);

export default UserLayout;
