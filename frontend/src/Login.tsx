import React, { useContext, useState } from "react";
import { Link, useHistory } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import cx from "classnames";

import AuthContext, { ContextType } from "src/AuthContext";
import { getPlatformURL, getCredentialsSetting } from "src/utils/createClient";

import "./App.scss";

const schema = yup.object({
  username: yup.string().required("Username is required"),
  password: yup.string().required("Password is required"),
});
type LoginFormData = yup.InferType<typeof schema>;

const Messages: Record<string, string> = {
  "password-reset": "Password successfully reset",
  "account-created": "Account successfully created",
};

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const history = useHistory();
  const [loginError, setLoginError] = useState("");
  const msg = new URLSearchParams(history.location.search.substr(1)).get("msg");
  const Auth = useContext<ContextType>(AuthContext);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(schema),
  });

  if (Auth.authenticated) history.push("/");

  const onSubmit = async (formData: LoginFormData) => {
    setLoading(true);
    const body = new FormData();
    body.append("username", formData.username);
    body.append("password", formData.password);
    const res = await fetch(`${getPlatformURL()}login`, {
      method: "POST",
      body,
      credentials: getCredentialsSetting(),
    }).finally(() => setLoading(false));
    if (res.ok) window.location.replace("/");
    else setLoginError("Access denied");
  };

  return (
    <div className="LoginPrompt mx-auto d-flex">
      <form
        className="align-self-center col-4 mx-auto"
        onSubmit={handleSubmit(onSubmit)}
      >
        <label className="row" htmlFor="username">
          <span className="col-4">Username: </span>
          <input
            type="text"
            className={cx("col-8", { "is-invalid": errors?.username })}
            {...register("username")}
          />
          <div className="invalid-feedback text-right">
            {errors?.username?.message}
          </div>
        </label>
        <label className="row" htmlFor="password">
          <span className="col-4">Password:</span>
          <input
            type="password"
            className={cx("col-8", { "is-invalid": errors?.password })}
            {...register("password")}
          />
          <div className="invalid-feedback text-right">
            {errors?.password?.message}
          </div>
        </label>
        <div className="row">
          <div className="col-9">
            <div>
              <Link to="/register">
                <small>Register</small>
              </Link>
            </div>
            <div>
              <Link to="/forgotPassword">
                <small>Forgot Password</small>
              </Link>
            </div>
          </div>
          <div className="col-3 d-flex justify-content-end pr-0">
            <div>
              <button
                type="submit"
                className="login-button btn btn-primary"
                disabled={loading}
              >
                Login
              </button>
            </div>
          </div>
        </div>
        <div className="row">
          <p className="col text-right text-danger">{loginError}</p>
        </div>
        <div className="row">
          <p className="col text-right text-success">
            {Messages[msg ?? ""] ?? ""}
          </p>
        </div>
      </form>
    </div>
  );
};

export default Login;
