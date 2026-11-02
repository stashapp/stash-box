import { useQueryRefHandlers, useReadQuery } from "@apollo/client/react";
import { createRoute, Outlet, useLoaderData } from "@tanstack/react-router";
import { type FC, startTransition } from "react";
import { ErrorMessage } from "src/components/fragments";
import { PageSkeleton } from "src/components/loading/Skeleton";
import Title from "src/components/title";
import type { PublicUserQuery, UserQuery } from "src/graphql";
import { PublicUserDocument, UserDocument } from "src/graphql";
import { adminRoute, narrowRoute } from "src/routing/layouts";
import { requireEntity } from "src/routing/requireEntity";
import {
  validateEmailSearch,
  validateEntitySearch,
  validateSceneSearch,
  validateTextSearch,
} from "src/routing/searchValidators";
import { isAdmin } from "src/utils";

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
  from: "/narrow/users/$name" | "/narrow/admin/users/$name";
}

export const UserDetailPage: FC<UserPageProps> = ({ from }) => {
  const { queryRef } = useLoaderData({ from });
  const { data } = useReadQuery<
    UserQuery | PublicUserQuery,
    "complete" | "streaming"
  >(queryRef);
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

export const UserEditPage: FC<UserPageProps> = ({ from }) => {
  const { queryRef } = useLoaderData({ from });
  const { data } = useReadQuery<
    UserQuery | PublicUserQuery,
    "complete" | "streaming"
  >(queryRef);
  const user = requireEntity(data.findUser);

  return (
    <>
      <Title page={`Edit ${user.name}`} />
      <UserEdit user={user} />
    </>
  );
};

export const UserEditsPage: FC<UserPageProps> = ({ from }) => {
  const { queryRef } = useLoaderData({ from });
  const { data } = useReadQuery<
    UserQuery | PublicUserQuery,
    "complete" | "streaming"
  >(queryRef);
  const user = requireEntity(data.findUser);

  return (
    <>
      <Title page={`Edits by ${user.name}`} />
      <UserEdits user={user} />
    </>
  );
};

export const UserConfirmEmailPage: FC<UserPageProps> = ({ from }) => {
  const { queryRef } = useLoaderData({ from });
  const { data } = useReadQuery<
    UserQuery | PublicUserQuery,
    "complete" | "streaming"
  >(queryRef);
  const user = requireEntity(data.findUser);

  return <UserConfirmChangeEmail user={user} />;
};

export const UserChangeEmailPage: FC<UserPageProps> = ({ from }) => {
  const { queryRef } = useLoaderData({ from });
  const { data } = useReadQuery<
    UserQuery | PublicUserQuery,
    "complete" | "streaming"
  >(queryRef);
  const user = requireEntity(data.findUser);

  return <UserValidateChangeEmail user={user} />;
};

export const UserImageTypesPage: FC<UserPageProps> = ({ from }) => {
  const { queryRef } = useLoaderData({ from });
  const { data } = useReadQuery<
    UserQuery | PublicUserQuery,
    "complete" | "streaming"
  >(queryRef);
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

export const UserNotificationsPage: FC<UserPageProps> = ({ from }) => {
  const { queryRef } = useLoaderData({ from });
  const { data } = useReadQuery<
    UserQuery | PublicUserQuery,
    "complete" | "streaming"
  >(queryRef);
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

const usersRoute = createRoute({
  getParentRoute: () => narrowRoute,
  path: "users",
});

const usersListRoute = createRoute({
  getParentRoute: () => usersRoute,
  path: "/",
  validateSearch: validateTextSearch,
  component: UserListPage,
});

const usersAddRoute = createRoute({
  getParentRoute: () => usersRoute,
  path: "add",
  component: UserAddPage,
});

const usersChangePasswordRoute = createRoute({
  getParentRoute: () => usersRoute,
  path: "change-password",
  component: UserChangePasswordPage,
});

const usersFingerprintsRoute = createRoute({
  getParentRoute: () => usersRoute,
  path: "fingerprints",
  validateSearch: validateSceneSearch,
  component: UserFingerprintsPage,
});

const usersEntityRoute = createRoute({
  getParentRoute: () => usersRoute,
  path: "$name",
  validateSearch: validateEntitySearch,
  loader: async ({ context: { client, preloadQuery, user }, params }) => {
    const variables = { name: params.name };
    const privateProfile = isAdmin(user) || user?.name === params.name;
    const queryRef = privateProfile
      ? preloadQuery(UserDocument, { variables })
      : preloadQuery(PublicUserDocument, { variables });
    await preloadQuery.toPromise(queryRef);
    requireEntity(
      client.readQuery({
        query: privateProfile ? UserDocument : PublicUserDocument,
        variables,
      })?.findUser,
    );
    return { queryRef };
  },
  pendingComponent: () => <PageSkeleton label="Loading user" />,
  notFoundComponent: () => <ErrorMessage error="User not found." />,
  component: Outlet,
});

const usersDetailRoute = createRoute({
  getParentRoute: () => usersEntityRoute,
  path: "/",
  component: () => <UserDetailPage from="/narrow/users/$name" />,
});

const usersEditRoute = createRoute({
  getParentRoute: () => usersEntityRoute,
  path: "edit",
  component: () => <UserEditPage from="/narrow/users/$name" />,
});

const usersEditsRoute = createRoute({
  getParentRoute: () => usersEntityRoute,
  path: "edits",
  component: () => <UserEditsPage from="/narrow/users/$name" />,
});

const usersConfirmEmailRoute = createRoute({
  getParentRoute: () => usersEntityRoute,
  path: "confirm-email",
  validateSearch: validateEmailSearch,
  component: () => <UserConfirmEmailPage from="/narrow/users/$name" />,
});

const usersChangeEmailRoute = createRoute({
  getParentRoute: () => usersEntityRoute,
  path: "change-email",
  validateSearch: validateEmailSearch,
  component: () => <UserChangeEmailPage from="/narrow/users/$name" />,
});

const usersImageTypesRoute = createRoute({
  getParentRoute: () => usersEntityRoute,
  path: "image-types",
  component: () => <UserImageTypesPage from="/narrow/users/$name" />,
});

const usersNotificationsRoute = createRoute({
  getParentRoute: () => usersEntityRoute,
  path: "notifications",
  component: () => <UserNotificationsPage from="/narrow/users/$name" />,
});

const adminUsersRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "users",
});

const adminUsersListRoute = createRoute({
  getParentRoute: () => adminUsersRoute,
  path: "/",
  validateSearch: validateTextSearch,
  component: UserListPage,
});

const adminUsersAddRoute = createRoute({
  getParentRoute: () => adminUsersRoute,
  path: "add",
  component: UserAddPage,
});

const adminUsersChangePasswordRoute = createRoute({
  getParentRoute: () => adminUsersRoute,
  path: "change-password",
  component: UserChangePasswordPage,
});

const adminUsersFingerprintsRoute = createRoute({
  getParentRoute: () => adminUsersRoute,
  path: "fingerprints",
  validateSearch: validateSceneSearch,
  component: UserFingerprintsPage,
});

const adminUsersEntityRoute = createRoute({
  getParentRoute: () => adminUsersRoute,
  path: "$name",
  validateSearch: validateEntitySearch,
  loader: async ({ context: { client, preloadQuery, user }, params }) => {
    const variables = { name: params.name };
    const privateProfile = isAdmin(user) || user?.name === params.name;
    const queryRef = privateProfile
      ? preloadQuery(UserDocument, { variables })
      : preloadQuery(PublicUserDocument, { variables });
    await preloadQuery.toPromise(queryRef);
    requireEntity(
      client.readQuery({
        query: privateProfile ? UserDocument : PublicUserDocument,
        variables,
      })?.findUser,
    );
    return { queryRef };
  },
  pendingComponent: () => <PageSkeleton label="Loading user" />,
  notFoundComponent: () => <ErrorMessage error="User not found." />,
  component: Outlet,
});

const adminUsersDetailRoute = createRoute({
  getParentRoute: () => adminUsersEntityRoute,
  path: "/",
  component: () => <UserDetailPage from="/narrow/admin/users/$name" />,
});

const adminUsersEditRoute = createRoute({
  getParentRoute: () => adminUsersEntityRoute,
  path: "edit",
  component: () => <UserEditPage from="/narrow/admin/users/$name" />,
});

const adminUsersEditsRoute = createRoute({
  getParentRoute: () => adminUsersEntityRoute,
  path: "edits",
  component: () => <UserEditsPage from="/narrow/admin/users/$name" />,
});

const adminUsersConfirmEmailRoute = createRoute({
  getParentRoute: () => adminUsersEntityRoute,
  path: "confirm-email",
  validateSearch: validateEmailSearch,
  component: () => <UserConfirmEmailPage from="/narrow/admin/users/$name" />,
});

const adminUsersChangeEmailRoute = createRoute({
  getParentRoute: () => adminUsersEntityRoute,
  path: "change-email",
  validateSearch: validateEmailSearch,
  component: () => <UserChangeEmailPage from="/narrow/admin/users/$name" />,
});

const adminUsersImageTypesRoute = createRoute({
  getParentRoute: () => adminUsersEntityRoute,
  path: "image-types",
  component: () => <UserImageTypesPage from="/narrow/admin/users/$name" />,
});

const adminUsersNotificationsRoute = createRoute({
  getParentRoute: () => adminUsersEntityRoute,
  path: "notifications",
  component: () => <UserNotificationsPage from="/narrow/admin/users/$name" />,
});

export const userRoutes = usersRoute.addChildren([
  usersListRoute,
  usersAddRoute,
  usersChangePasswordRoute,
  usersFingerprintsRoute,
  usersEntityRoute.addChildren([
    usersDetailRoute,
    usersEditRoute,
    usersEditsRoute,
    usersConfirmEmailRoute,
    usersChangeEmailRoute,
    usersImageTypesRoute,
    usersNotificationsRoute,
  ]),
]);

export const adminUserRoutes = adminUsersRoute.addChildren([
  adminUsersListRoute,
  adminUsersAddRoute,
  adminUsersChangePasswordRoute,
  adminUsersFingerprintsRoute,
  adminUsersEntityRoute.addChildren([
    adminUsersDetailRoute,
    adminUsersEditRoute,
    adminUsersEditsRoute,
    adminUsersConfirmEmailRoute,
    adminUsersChangeEmailRoute,
    adminUsersImageTypesRoute,
    adminUsersNotificationsRoute,
  ]),
]);
