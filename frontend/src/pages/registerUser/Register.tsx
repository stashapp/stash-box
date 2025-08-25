import { type FC, useState } from "react";
import type { ApolloError } from "@apollo/client";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Button, Form, Row, Col } from "react-bootstrap";
import cx from "classnames";

import { ErrorMessage, LoadingIndicator } from "src/components/fragments";
import Title from "src/components/title";
import { useNewUser, useConfig, type ConfigQuery } from "src/graphql";
import * as yup from "yup";

import { ROUTE_HOME, ROUTE_ACTIVATE, ROUTE_LOGIN } from "src/constants/route";
import { useCurrentUser } from "src/hooks";

const schema = yup.object({
  email: yup.string().email().required("Email is required"),
  inviteKey: yup
    .string()
    .trim()
    .uuid("Invalid invite key")
    .required("Invite key is required"),
});
type RegisterFormData = yup.Asserts<typeof schema>;

interface Props {
  config: ConfigQuery["getConfig"];
}

const Register: FC<Props> = ({ config }) => {
  const navigate = useNavigate();
  const [awaitingActivation, setAwaitingActivation] = useState(false);
  const { isAuthenticated } = useCurrentUser();
  const [submitError, setSubmitError] = useState<string | undefined>();

  const inviteRequired = config.require_invite ?? true;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: yupResolver(schema),
  });

  const [newUser] = useNewUser();

  if (isAuthenticated) navigate(ROUTE_HOME);

  const onSubmit = (formData: RegisterFormData) => {
    const userData = {
      email: formData.email,
      invite_key: formData.inviteKey,
    };
    setSubmitError(undefined);
    newUser({ variables: { input: userData } })
      .then((response) => {
        if (response.data?.newUser) {
          navigate(
            `${ROUTE_ACTIVATE}?email=${encodeURIComponent(
              formData.email,
            )}&key=${response.data.newUser}`,
          );
        } else {
          setAwaitingActivation(true);
        }
      })
      .catch((err?: ApolloError) => {
        if (err?.message) {
          setSubmitError(err.message);
        }
      });
  };

  if (awaitingActivation)
    return (
      <div className="LoginPrompt">
        <div className="align-self-center col-8 mx-auto">
          <h5>Invite key accepted</h5>
          <p>Please check your email to complete your registration.</p>
          <a href={ROUTE_LOGIN}>Return to login</a>
        </div>
      </div>
    );

  const errorList = [
    errors.inviteKey?.message,
    errors.email?.message,
    submitError,
  ].filter((err): err is string => err !== undefined);

  return (
    <div className="LoginPrompt mx-auto d-flex">
      <Title page="Register Account" />
      <Form
        className="align-self-center col-8 mx-auto"
        onSubmit={handleSubmit(onSubmit)}
      >
        <Form.Group controlId="email">
          <h3>Register account</h3>
          <hr className="my-4" />
          <Row>
            <Col xs={4}>
              <Form.Label>Email:</Form.Label>
            </Col>
            <Col xs={8}>
              <Form.Control
                className={cx({ "is-invalid": errors?.email })}
                type="text"
                placeholder="Email"
                {...register("email")}
              />
            </Col>
          </Row>
        </Form.Group>

        {inviteRequired ? (
          <Form.Group controlId="inviteKey" className="mt-2">
            <Row>
              <Col xs={4}>
                <Form.Label>Invite Key:</Form.Label>
              </Col>
              <Col xs={8}>
                <Form.Control
                  className={cx({ "is-invalid": errors?.inviteKey })}
                  type="text"
                  placeholder="Invite Key"
                  {...register("inviteKey")}
                />
              </Col>
            </Row>
          </Form.Group>
        ) : (
          <Form.Control type="hidden" value="-" {...register("inviteKey")} />
        )}

        {errorList.map((error) => (
          <Row key={error} className="text-end text-danger">
            <div>{error}</div>
          </Row>
        ))}

        <Row>
          <Col
            xs={{ span: 2, offset: 10 }}
            className="justify-content-end mt-2 d-flex"
          >
            <Button type="submit">Register</Button>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

const ConfigLoader = () => {
  const { data: config, loading } = useConfig();
  if (loading) return <LoadingIndicator message="Loading config..." />;

  if (!config)
    return <ErrorMessage error="Unable to load server configuration" />;

  return <Register config={config.getConfig} />;
};

export default ConfigLoader;
