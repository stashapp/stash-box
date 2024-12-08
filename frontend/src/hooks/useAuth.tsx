import { useMe } from "src/graphql";
import { getCachedUser, setCachedUser } from "src/utils";
import { User } from "../AuthContext";

interface AuthResult {
  loading: boolean;
  user: User | undefined;
}

const useAuth = (): AuthResult => {
  const { loading, data } = useMe({
    fetchPolicy: "network-only",
    onCompleted: (res) => setCachedUser(res.me),
    onError: () => setCachedUser(),
  });

  return { loading, user: loading ? getCachedUser() : (data?.me ?? undefined) };
};

export default useAuth;
