import { useMutation } from "@apollo/client";
import { yupResolver } from "@hookform/resolvers";
import { loader } from "graphql.macro";
import React, { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import { useHistory, useLocation } from "react-router-dom";
import AuthContext, { ContextType } from "src/AuthContext";
import * as yup from "yup";
import cx from "classnames";
import {
  ChangePasswordMutation,
  ChangePasswordMutationVariables,
} from "src/definitions/ChangePasswordMutation";
import { Form } from "react-bootstrap";

const ChangePassword = loader("src/mutations/ChangePassword.gql");

const schema = yup.object().shape({
  email: yup.string().email().required("Email is required"),
  resetKey: yup.string().required("Reset Key is required"),
  password: yup.string().required("Password is required"),
});
type ResetPasswordFormData = yup.InferType<typeof schema>;

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const ResetPassword: React.FC = () => {
  const history = useHistory();
  const query = useQuery();
  const Auth = useContext<ContextType>(AuthContext);
  const [submitError, setSubmitError] = useState<string | undefined>();

  const { register, handleSubmit, errors } = useForm<ResetPasswordFormData>({
    resolver: yupResolver(schema),
  });

  const [changePassword, { loading }] = useMutation<
    ChangePasswordMutation,
    ChangePasswordMutationVariables
  >(ChangePassword);

  if (Auth.authenticated) history.push("/");

  const onSubmit = (formData: ResetPasswordFormData) => {
    const userData = {
      reset_key: formData.resetKey,
      new_password: formData.password,
    };
    setSubmitError(undefined);
    changePassword({ variables: { userData } })
      .then(() => {
        history.push("/login", { msg: "password-reset" });
      })
      .catch((err) => {
        if (err && err.message) {
          setSubmitError(err.message as string);
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
          name="email"
          value={query.get("email") ?? ""}
          ref={register}
        />
        <Form.Control
          type="hidden"
          name="resetKey"
          value={query.get("key") ?? ""}
          ref={register}
        />
        <label className="row" htmlFor="password">
          <span className="col-4">New Password: </span>
          <input
            className={cx("col-8", { "is-invalid": errors?.password })}
            name="password"
            type="password"
            placeholder="Password"
            ref={register}
          />
          <div className="invalid-feedback">{errors?.password?.message}</div>
        </label>
        <div className="row">
          <div className="col-3 offset-9 d-flex justify-content-end pr-0">
            <div>
              <button type="submit" className="register-button btn btn-primary" disabled={loading}>
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
