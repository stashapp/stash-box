import { useCallback, useContext, useMemo } from "react";
import AuthContext from "src/context";
import { useConfig } from "src/graphql/queries";
import {
  canEdit,
  canModerate,
  canTagEdit,
  canVote,
  isAdmin as userIsAdmin,
} from "src/utils";

export const useCurrentUser = () => {
  const auth = useContext(AuthContext);
  const { data: config } = useConfig();
  const requireTagRole = config?.getConfig.require_tag_role ?? false;

  const isAdmin = useMemo(() => userIsAdmin(auth.user), [auth.user]);
  const isEditor = useMemo(() => canEdit(auth.user), [auth.user]);
  const isVoter = useMemo(() => canVote(auth.user), [auth.user]);
  const isModerator = useMemo(() => canModerate(auth.user), [auth.user]);
  const isTagEditor = useMemo(
    () => (requireTagRole ? canTagEdit(auth.user) : canEdit(auth.user)),
    [auth.user, requireTagRole],
  );
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
    isTagEditor,
    isVoter,
    isModerator,
    isAuthenticated: auth.authenticated,
    user: auth.user,
  };
};
