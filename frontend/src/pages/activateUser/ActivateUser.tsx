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
  ActivateNewUserMutation,
  ActivateNewUserMutationVariables,
} from "src/definitions/ActivateNewUserMutation";
import { Form } from "react-bootstrap";

import { ROUTE_HOME, ROUTE_LOGIN } from "src/constants/route";

const ActivateNewUser = loader("src/mutations/ActivateNewUser.gql");

const schema = yup.object().shape({
  name: yup.string().required("Username is required"),
  email: yup.string().email().required("Email is required"),
  activationKey: yup.string().required("Activation Key is required"),
  password: yup.string().required("Password is required"),
});
type ActivateNewUserFormData = yup.InferType<typeof schema>;

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const ActivateNewUserPage: React.FC = () => {
  const query = useQuery();
  const history = useHistory();
  const Auth = useContext<ContextType>(AuthContext);
  const [submitError, setSubmitError] = useState<string | undefined>();

  const { register, handleSubmit, errors } = useForm<ActivateNewUserFormData>({
    resolver: yupResolver(schema),
  });

  const [activateNewUser] = useMutation<
    ActivateNewUserMutation,
    ActivateNewUserMutationVariables
  >(ActivateNewUser);

  if (Auth.authenticated) history.push(ROUTE_HOME);

  const onSubmit = (formData: ActivateNewUserFormData) => {
    const userData = {
      name: formData.name,
      email: formData.email,
      activation_key: formData.activationKey,
      password: formData.password,
    };
    setSubmitError(undefined);
    activateNewUser({ variables: { input: userData } })
      .then(() => {
        history.push(`${ROUTE_LOGIN}?msg=account-created`);
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
          name="activationKey"
          value={query.get("key") ?? ""}
          ref={register}
        />

        <label className="row" htmlFor="name">
          <span className="col-4">Username: </span>
          <input
            className={cx("col-8", { "is-invalid": errors?.name })}
            name="name"
            type="text"
            placeholder="Username"
            ref={register}
          />
          <div className="invalid-feedback">{errors?.name?.message}</div>
        </label>

        <label className="row" htmlFor="password">
          <span className="col-4">Password: </span>
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
              <button type="submit" className="register-button btn btn-primary">
                Create Account
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

export default ActivateNewUserPage;
