import React, { useContext, useState } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { useHistory, useLocation } from "react-router-dom";
import AuthContext, { ContextType } from "src/AuthContext";
import * as yup from "yup";
import cx from "classnames";
import { Form } from "react-bootstrap";

import { useChangePassword } from "src/graphql";
import { ROUTE_HOME, ROUTE_LOGIN } from "src/constants/route";

const schema = yup.object({
  email: yup.string().email().required("Email is required"),
  resetKey: yup.string().required("Reset Key is required"),
  password: yup.string().required("Password is required"),
});
type ResetPasswordFormData = yup.Asserts<typeof schema>;

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const ResetPassword: React.FC = () => {
  const history = useHistory();
  const query = useQuery();
  const Auth = useContext<ContextType>(AuthContext);
  const [submitError, setSubmitError] = useState<string | undefined>();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: yupResolver(schema),
  });

  const [changePassword, { loading }] = useChangePassword();

  if (Auth.authenticated) history.push(ROUTE_HOME);

  const onSubmit = (formData: ResetPasswordFormData) => {
    const userData = {
      reset_key: formData.resetKey,
      new_password: formData.password,
    };
    setSubmitError(undefined);
    changePassword({ variables: { userData } })
      .then(() => {
        history.push(`${ROUTE_LOGIN}?msg=password-reset`);
      })
      .catch((err) => {
        if (err && err.message) {
          setSubmitError(err.message);
        }
      });
  };

  return (
    <div className="LoginPrompt mx-auto d-flex">
      <form
        className="align-self-center col-8 mx-auto"
        onSubmit={handleSubmit(onSubmit)}
      >
        <Form.Control
          type="hidden"
          value={query.get("email") ?? ""}
          {...register("email")}
        />
        <Form.Control
          type="hidden"
          value={query.get("key") ?? ""}
          {...register("resetKey")}
        />
        <label className="row" htmlFor="password">
          <span className="col-4">New Password: </span>
          <input
            className={cx("col-8", { "is-invalid": errors?.password })}
            type="password"
            placeholder="Password"
            {...register("password")}
          />
          <div className="invalid-feedback">{errors?.password?.message}</div>
        </label>
        <div className="row">
          <div className="col-3 offset-9 d-flex justify-content-end pr-0">
            <div>
              <button
                type="submit"
                className="register-button btn btn-primary"
                disabled={loading}
              >
                Set Password
              </button>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="text-danger">{submitError}</div>
        </div>
      </form>
    </div>
  );
};

export default ResetPassword;
