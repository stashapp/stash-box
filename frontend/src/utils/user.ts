import { User } from "../AuthContext";
import { User_findUser as PrivateUser } from "src/graphql/definitions/User";
import { PublicUser_findUser as PublicUser } from "src/graphql/definitions/PublicUser";

const USER_STORAGE = "stash_box_user";
const cache = localStorage.getItem(USER_STORAGE);
const cachedUser = cache ? (JSON.parse(cache) as User) : undefined;

export const getCachedUser = () => cachedUser;
export const setCachedUser = (user?: User | undefined | null) => {
  if (user) localStorage.setItem(USER_STORAGE, JSON.stringify(user));
  else localStorage.removeItem(USER_STORAGE);
};

export const isPrivateUser = (
  user: PublicUser | PrivateUser
): user is PrivateUser => !!(user as PrivateUser).email;
