import { useContext, useMemo, useCallback } from "react";

import AuthContext from "src/context";
import { isAdmin as userIsAdmin, canEdit, canVote } from "src/utils";

export const useCurrentUser = () => {
  const auth = useContext(AuthContext);

  const isAdmin = useMemo(() => userIsAdmin(auth.user), [auth.user]);
  const isEditor = useMemo(() => canEdit(auth.user), [auth.user]);
  const isVoter = useMemo(() => canVote(auth.user), [auth.user]);
  const isSelf = useCallback(
    (user?: (typeof auth)["user"] | string | null) => {
      if (!auth.user?.id || !user) return false;
      if (typeof user === "string") return user === auth.user.id;
      return user?.id === auth.user.id;
    },
    [auth.user],
  );

  return {
    isAdmin,
    isSelf,
    isEditor,
    isVoter,
    isAuthenticated: auth.authenticated,
    user: auth.user,
  };
};
