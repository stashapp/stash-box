import { createContext, useContext } from "react";

import { RoleEnum } from "src/graphql";

export interface User {
  id: string;
  name: string;
  roles?: RoleEnum[] | null;
}

export type ContextType = {
  authenticated: boolean;
  user?: User;
};

const AuthContext = createContext<ContextType>({
  authenticated: false,
});

export const useAuthContext = () => useContext(AuthContext);

export default AuthContext;
