import React from "react";

import { RoleEnum } from "src/graphql";

export interface User {
  id: string;
  name: string;
  roles: RoleEnum[];
}

export type ContextType = {
  authenticated: boolean;
  user?: User;
};

const AuthContext = React.createContext<ContextType>({
  authenticated: false,
});

export default AuthContext;
