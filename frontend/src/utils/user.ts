import { User } from "../AuthContext";

const USER_STORAGE = "stash_box_user";
const cache = localStorage.getItem(USER_STORAGE);
const cachedUser = cache ? (JSON.parse(cache) as User) : undefined;

export const getCachedUser = () => cachedUser;
export const setCachedUser = (user?: User | undefined | null) => {
  if (user) localStorage.setItem(USER_STORAGE, JSON.stringify(user));
  else localStorage.removeItem(USER_STORAGE);
};
