import { FC, useContext, useState } from "react";
import { ApolloError } from "@apollo/client";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { useNavigate, useLocation } from "react-router-dom";
import { Button, Form, Row, Col } from "react-bootstrap";
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (value, { parent }) => value?.trim() !== parent?.email
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
  const navigate = useNavigate();
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

  if (Auth.authenticated) navigate(ROUTE_HOME);

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
        navigate(`${ROUTE_LOGIN}?msg=account-created`);
      })
      .catch((err?: ApolloError) => {
        if (err?.message) {
          setSubmitError(err.message);
        }
      });
  };

  const errorList = [
    errors.activationKey?.message,
    errors.email?.message,
    errors.name?.message,
    errors.password?.message,
    submitError,
  ].filter((err): err is string => err !== undefined);

  return (
    <div className="LoginPrompt">
      <Title page="Active User" />
      <Form
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

        <Form.Group controlId="name">
          <Row>
            <Col xs={4}>
              <Form.Label>Username:</Form.Label>
            </Col>
            <Col xs={8}>
              <Form.Control
                className={cx({ "is-invalid": errors?.name })}
                type="text"
                placeholder="Username"
                {...register("name")}
              />
            </Col>
          </Row>
        </Form.Group>

        <Form.Group controlId="password" className="mt-2">
          <Row>
            <Col xs={4}>
              <Form.Label>Password:</Form.Label>
            </Col>
            <Col xs={8}>
              <Form.Control
                className={cx({ "is-invalid": errors?.password })}
                type="password"
                placeholder="Password"
                {...register("password")}
              />
            </Col>
          </Row>
        </Form.Group>

        {errorList.map((error) => (
          <Row key={error} className="text-end text-danger">
            <div>{error}</div>
          </Row>
        ))}

        <Row>
          <Col
            xs={{ span: 3, offset: 9 }}
            className="justify-content-end mt-2 d-flex"
          >
            <Button type="submit">Create Account</Button>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default ActivateNewUserPage;
