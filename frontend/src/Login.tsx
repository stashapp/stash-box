import React, { useRef, useContext } from 'react';
import { useMutation } from '@apollo/react-hooks';
import { RouteComponentProps, navigate } from '@reach/router';
import LoginMutation from './mutations/Login.gql';
import { setToken } from './utils/createClient';
import AuthContext, { ContextProps } from './AuthContext';

import './App.scss';

const Login: React.FC<RouteComponentProps> = () => {
    const Auth = useContext<ContextProps>(AuthContext);
    const [loginUser] = useMutation(LoginMutation, {
        onCompleted: ({ loginUser: { bearer, user } }) => {
            setToken(bearer);
            Auth.setUser(user);
        }
    });
    const email = useRef<HTMLInputElement>(null);
    const password = useRef<HTMLInputElement>(null);

    if (Auth.authenticated)
        navigate('/');

    const submitLogin = () => {
        loginUser({
            variables: {
                email: (email && email.current && email.current.value) || '',
                password: password && password.current && password.current.value
            }
        });
    };

    return (
        <div className="LoginPrompt">
            <div className="email">
                <label>
Email:
                    <input ref={email} type="text" />
                </label>
            </div>
            <div className="password">
                <label>
Password:
                    <input ref={password} type="password" />
                </label>
            </div>
            <button type="submit" className="login-button btn btn-primary" onClick={submitLogin}>Login</button>
        </div>
    );
};

export default Login;
