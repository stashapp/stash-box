import React from 'react';

interface User {
    username?: string,
    role?: number
}


export type ContextProps = {
    authenticated: boolean,
    user?: User;
    setUser?: (user:User) => void
};

const AuthContext = React.createContext<ContextProps>({
    authenticated: false,
});

export default AuthContext;
