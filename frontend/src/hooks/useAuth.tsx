import { useMe } from "src/graphql";
import { getCachedUser, setCachedUser } from "src/utils";
import type { User } from "../context";

interface AuthResult {
  loading: boolean;
  user: User | undefined;
}

const useAuth = (): AuthResult => {
  const { loading, data } = useMe({
    fetchPolicy: "cache-first",
  });
  setCachedUser(data?.me ?? undefined);

  return { loading, user: loading ? getCachedUser() : (data?.me ?? undefined) };
};

export default useAuth;
