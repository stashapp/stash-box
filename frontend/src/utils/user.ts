import { User } from "../AuthContext";
import { UserQuery, PublicUserQuery } from "src/graphql";

type PrivateUser = NonNullable<UserQuery["findUser"]>;
type PublicUser = NonNullable<PublicUserQuery["findUser"]>;

const USER_STORAGE = "stash_box_user";
const cache = localStorage.getItem(USER_STORAGE);
const cachedUser = cache ? (JSON.parse(cache) as User) : undefined;

export const getCachedUser = () => cachedUser;
export const setCachedUser = (user?: User | null) => {
  if (user) localStorage.setItem(USER_STORAGE, JSON.stringify(user));
  else localStorage.removeItem(USER_STORAGE);
};

export const isPrivateUser = (
  user: PublicUser | PrivateUser,
): user is PrivateUser => !!(user as PrivateUser).email;
