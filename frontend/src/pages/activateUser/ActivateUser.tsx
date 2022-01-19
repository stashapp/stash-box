import { FC, useContext, useState } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { useHistory, useLocation } from "react-router-dom";
import { Form } from "react-bootstrap";
import AuthContext, { ContextType } from "src/AuthContext";
import * as yup from "yup";
import cx from "classnames";

import { useActivateUser } from "src/graphql";
import { ROUTE_HOME, ROUTE_LOGIN } from "src/constants/route";
import Title from "src/components/title";

const schema = yup.object({
  name: yup
    .string()
    .required("Username is required")
    .test(
      "excludeEmail",
      "The username is public and should not be the same as your email",
      (value, { parent }) => value?.trim() !== parent.email
    ),
  email: yup.string().email().required("Email is required"),
  activationKey: yup.string().required("Activation Key is required"),
  password: yup.string().required("Password is required"),
});
type ActivateNewUserFormData = yup.InferType<typeof schema>;

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const ActivateNewUserPage: FC = () => {
  const query = useQuery();
  const history = useHistory();
  const Auth = useContext<ContextType>(AuthContext);
  const [submitError, setSubmitError] = useState<string | undefined>();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ActivateNewUserFormData>({
    resolver: yupResolver(schema),
  });

  const [activateNewUser] = useActivateUser();

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
      <Title page="Active User" />
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
          {...register("activationKey")}
        />

        <label className="row" htmlFor="name">
          <span className="col-4">Username: </span>
          <input
            className={cx("col-8", { "is-invalid": errors?.name })}
            type="text"
            placeholder="Username"
            {...register("name")}
          />
          <div className="col invalid-feedback">{errors?.name?.message}</div>
        </label>

        <label className="row" htmlFor="password">
          <span className="col-4">Password: </span>
          <input
            className={cx("col-8", { "is-invalid": errors?.password })}
            type="password"
            placeholder="Password"
            {...register("password")}
          />
          <div className="col invalid-feedback">
            {errors?.password?.message}
          </div>
        </label>
        <div className="row">
          <div className="col-3 offset-9 d-flex justify-content-end">
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
