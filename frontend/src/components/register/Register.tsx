import { useMutation } from "@apollo/client";
import { yupResolver } from "@hookform/resolvers";
import { loader } from "graphql.macro";
import React, { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import { useHistory } from "react-router-dom";

import AuthContext, { ContextType } from "src/AuthContext";
import {
  NewUserMutation,
  NewUserMutationVariables,
} from "src/definitions/NewUserMutation";
import * as yup from "yup";
import cx from "classnames";

const NewUser = loader("src/mutations/NewUser.gql");

const schema = yup.object().shape({
  email: yup.string().email().required("Email is required"),
  inviteKey: yup.string().required("Invite key is required"),
});
type RegisterFormData = yup.InferType<typeof schema>;

const Register: React.FC = () => {
  const history = useHistory();
  const [awaitingActivation, setAwaitingActivation] = useState(false);
  const Auth = useContext<ContextType>(AuthContext);
  const [submitError, setSubmitError] = useState<string | undefined>();

  const { register, handleSubmit, errors } = useForm<RegisterFormData>({
    resolver: yupResolver(schema),
  });

  const [newUser] = useMutation<NewUserMutation, NewUserMutationVariables>(
    NewUser
  );

  if (Auth.authenticated) history.push("/");

  const onSubmit = (formData: RegisterFormData) => {
    const userData = {
      email: formData.email,
      invite_key: formData.inviteKey,
    };
    setSubmitError(undefined);
    newUser({ variables: { input: userData } })
      .then((response) => {
        if (response.data?.newUser) {
          history.push(
            `/activate?email=${formData.email}&key=${response.data.newUser}`
          );
        } else {
          setAwaitingActivation(true);
        }
      })
      .catch((err) => {
        if (err && err.message) {
          setSubmitError(err.message as string);
        }
      });
  };

  if (awaitingActivation)
    return (
      <div className="LoginPrompt mx-auto d-flex">
        <div className="align-self-center col-8 mx-auto">
          <h5>Invite key accepted</h5>
          <p>Please check your email to complete your registration.</p>
          <a href="/login">Return to login</a>
        </div>
      </div>
    );

  return (
    <div className="LoginPrompt mx-auto d-flex">
      <form
        className="align-self-center col-8 mx-auto"
        onSubmit={handleSubmit(onSubmit)}
      >
        <label className="row" htmlFor="email">
          <span className="col-4">Email: </span>
          <input
            className={cx("col-8", { "is-invalid": errors?.email })}
            name="email"
            type="email"
            placeholder="Email"
            ref={register}
          />
          <div className="invalid-feedback text-right">
            {errors?.email?.message}
          </div>
        </label>
        <label className="row" htmlFor="inviteKey">
          <span className="col-4">Invite Key: </span>
          <input
            className={cx("col-8", { "is-invalid": errors?.inviteKey })}
            name="inviteKey"
            type="text"
            placeholder="Invite Key"
            ref={register}
          />
          <div className="invalid-feedback text-right">
            {errors?.inviteKey?.message}
          </div>
        </label>
        <div className="row">
          <div className="col-3 offset-9 d-flex justify-content-end pr-0">
            <div>
              <button type="submit" className="register-button btn btn-primary">
                Register
              </button>
            </div>
          </div>
        </div>
        <div className="row">
          <p className="col text-danger text-right">{submitError}</p>
        </div>
      </form>
    </div>
  );
};

export default Register;
