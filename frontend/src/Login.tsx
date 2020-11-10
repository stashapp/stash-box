import React, { useRef, useContext } from "react";
import { Link, useHistory } from "react-router-dom";
import AuthContext, { ContextType } from "src/AuthContext";

import { getPlatformURL, getCredentialsSetting } from "src/utils/createClient";

import "./App.scss";

const Login: React.FC = () => {
  const history = useHistory();
  const Auth = useContext<ContextType>(AuthContext);
  const username = useRef<HTMLInputElement>(null);
  const password = useRef<HTMLInputElement>(null);

  if (Auth.authenticated) history.push("/");

  const submitLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData();
    data.append("username", username.current?.value ?? "");
    data.append("password", password.current?.value ?? "");

    const res = await fetch(`${getPlatformURL()}login`, {
      method: "POST",
      body: data,
      credentials: getCredentialsSetting(),
    });
    if (res.ok) window.location.replace("/");
  };

  return (
    <div className="LoginPrompt mx-auto d-flex">
      <form className="align-self-center col-4 mx-auto" onSubmit={submitLogin}>
        <label className="row" htmlFor="username">
          <span className="col-4">Username: </span>
          <input ref={username} type="text" className="col-8" name="username" />
        </label>
        <label className="row" htmlFor="password">
          <span className="col-4">Password:</span>
          <input
            ref={password}
            type="password"
            className="col-8"
            name="password"
          />
        </label>
        <div className="row">
          <div className="col-9">
            <div>
              <Link to={`/register`}>
                <small>Register</small>
              </Link>
            </div>
            <div>
              <Link to={`/resetPassword`}>
                <small>Forgot Password</small>
              </Link>
            </div>
          </div>
          <div className="col-3 d-flex justify-content-end pr-0">
            <div>
              <button
                type="submit"
                className="login-button btn btn-primary"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Login;
