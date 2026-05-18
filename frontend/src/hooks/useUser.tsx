import { usePrivateUser, usePublicUser } from "src/graphql/queries";
import type { UserQueryVariables } from "src/graphql/types";
import { useCurrentUser } from "./useCurrentUser";

export const useUser = (variables: UserQueryVariables, skip = false) => {
  const { isAdmin, user } = useCurrentUser();
  const isUser = () => user?.name === variables.name;
  const showPrivate = isUser() || isAdmin;

  const privateUser = usePrivateUser(variables, skip || !showPrivate);
  const publicUser = usePublicUser(variables, skip || showPrivate);

  return showPrivate ? privateUser : publicUser;
};
