import React from "react";
import { RoleEnum } from "src/definitions/globalTypes";

export interface User {
  id: string;
  name: string;
  roles: RoleEnum[] | null;
}

export type ContextType = {
  authenticated: boolean;
  user?: User;
  setUser?: (user: User) => void;
  isRole?: (role: string) => boolean;
};

const AuthContext = React.createContext<ContextType>({
  authenticated: false,
});

export default AuthContext;
