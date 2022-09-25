import { createContext } from "react";

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

export default AuthContext;
