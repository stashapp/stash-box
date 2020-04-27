import React from "react";

export interface User {
  name?: string;
  roles?: string[];
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
