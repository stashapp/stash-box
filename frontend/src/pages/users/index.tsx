import {
  type QueryRef,
  useQueryRefHandlers,
  useReadQuery,
} from "@apollo/client/react";
import { type FC, startTransition } from "react";
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

interface UserPageProps {
  queryRef: QueryRef<UserQuery | PublicUserQuery>;
}

export const UserDetailPage: FC<UserPageProps> = ({ queryRef }) => {
  const { data } = useReadQuery(queryRef);
  const user = requireEntity(data.findUser);
  const { refetch: refetchQuery } = useQueryRefHandlers(queryRef);
  const refetch = () =>
    startTransition(() => {
      void refetchQuery().catch(() => undefined);
    });

  return (
    <>
      <Title page={user.name} />
      <User user={user} refetch={refetch} />
    </>
  );
};

export const UserEditPage: FC<UserPageProps> = ({ queryRef }) => {
  const { data } = useReadQuery(queryRef);
  const user = requireEntity(data.findUser);

  return (
    <>
      <Title page={`Edit ${user.name}`} />
      <UserEdit user={user} />
    </>
  );
};

export const UserEditsPage: FC<UserPageProps> = ({ queryRef }) => {
  const { data } = useReadQuery(queryRef);
  const user = requireEntity(data.findUser);

  return (
    <>
      <Title page={`Edits by ${user.name}`} />
      <UserEdits user={user} />
    </>
  );
};

export const UserConfirmEmailPage: FC<UserPageProps> = ({ queryRef }) => {
  const { data } = useReadQuery(queryRef);
  const user = requireEntity(data.findUser);

  return <UserConfirmChangeEmail user={user} />;
};

export const UserChangeEmailPage: FC<UserPageProps> = ({ queryRef }) => {
  const { data } = useReadQuery(queryRef);
  const user = requireEntity(data.findUser);

  return <UserValidateChangeEmail user={user} />;
};

export const UserImageTypesPage: FC<UserPageProps> = ({ queryRef }) => {
  const { data } = useReadQuery(queryRef);
  const user = requireEntity(data.findUser);

  return "image_type_preferences" in user ? (
    <>
      <Title page={"Image Preferences"} />
      <UserImageTypePreferences user={user} />
    </>
  ) : (
    <ErrorMessage error="Forbidden" />
  );
};

export const UserNotificationsPage: FC<UserPageProps> = ({ queryRef }) => {
  const { data } = useReadQuery(queryRef);
  const user = requireEntity(data.findUser);

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

export default UserDetailPage;
