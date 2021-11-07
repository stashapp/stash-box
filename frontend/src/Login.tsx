import { FC, useContext, useState } from "react";
import { Link, useHistory } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Button, Col, Form, Row } from "react-bootstrap";
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

const Login: FC = () => {
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
      <Form
        className="align-self-center col-4 mx-auto"
        onSubmit={handleSubmit(onSubmit)}
      >
        <Form.Floating>
          <Form.Control
            className={cx({ "is-invalid": errors?.username })}
            placeholder="Username"
            {...register("username")}
          />
          <Form.Label>Username</Form.Label>
          <div className="invalid-feedback text-end">
            {errors?.username?.message}
          </div>
        </Form.Floating>
        <Form.Floating className="my-3">
          <Form.Control
            type="password"
            className={cx({ "is-invalid": errors?.password })}
            placeholder="Password"
            {...register("password")}
          />
          <Form.Label>Password</Form.Label>
          <div className="invalid-feedback text-end">
            {errors?.password?.message}
          </div>
        </Form.Floating>
        <Row>
          <Col xs={9}>
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
          </Col>
          <Col xs={3} className="d-flex justify-content-end pr-0">
            <div>
              <Button type="submit" className="login-button" disabled={loading}>
                Login
              </Button>
            </div>
          </Col>
        </Row>
        <Row>
          <p className="col text-end text-danger">{loginError}</p>
        </Row>
        <Row>
          <p className="col text-end text-success">
            {Messages[msg ?? ""] ?? ""}
          </p>
        </Row>
      </Form>
    </div>
  );
};

export default Login;
