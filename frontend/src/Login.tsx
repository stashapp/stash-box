import React, { useRef, useContext } from "react";
import { useHistory } from "react-router-dom";
import AuthContext, { ContextType } from "src/AuthContext";

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

    const res = await fetch(`${process.env.REACT_APP_SERVER}/login`, {
      method: "POST",
      body: data,
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
        <button
          type="submit"
          className="login-button btn btn-primary col-3 offset-9"
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;
