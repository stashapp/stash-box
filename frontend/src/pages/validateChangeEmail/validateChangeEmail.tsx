import { FC, useContext, useState } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { isApolloError } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import AuthContext, { ContextType } from "src/AuthContext";
import * as yup from "yup";
import cx from "classnames";
import { Button, Form, Row, Col } from "react-bootstrap";

import { useQueryParams } from "src/hooks";
import { ErrorMessage } from "src/components/fragments";
import Title from "src/components/title";
import { useValidateChangeEmail } from "src/graphql";
import { ROUTE_HOME } from "src/constants/route";

const schema = yup.object({
  token: yup.string().required(),
  email: yup.string().required("Email is required"),
});
type ValidateChangeEmailFormData = yup.Asserts<typeof schema>;

const ValidateChangeEmail: FC = () => {
  const navigate = useNavigate();
  const Auth = useContext<ContextType>(AuthContext);
  const [submitError, setSubmitError] = useState<string | undefined>();
  const [{ token, submitted }, setQueryParam] = useQueryParams({
    token: { name: "token", type: "string" },
    submitted: { name: "submitted", type: "boolean" },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ValidateChangeEmailFormData>({
    resolver: yupResolver(schema),
  });

  const [validateChangeEmail, { loading }] = useValidateChangeEmail();

  if (submitted) return <div>Submitted!</div>;

  if (!token) return <ErrorMessage error="Missing token" />;

  if (Auth.authenticated) navigate(ROUTE_HOME);

  const onSubmit = (formData: ValidateChangeEmailFormData) => {
    setSubmitError(undefined);
    validateChangeEmail({ variables: { ...formData } })
      .then(() => {
        setQueryParam("submitted", true);
      })
      .catch(
        (error: unknown) =>
          error instanceof Error &&
          isApolloError(error) &&
          setSubmitError(error.message)
      );
  };

  const errorList = [
    errors.token?.message,
    errors.email?.message,
    submitError,
  ].filter((err): err is string => err !== undefined);

  return (
    <div className="LoginPrompt">
      <Title page="Confirm Email" />
      <Form
        className="align-self-center col-8 mx-auto"
        onSubmit={handleSubmit(onSubmit)}
      >
        <Form.Control type="hidden" value={token} {...register("token")} />

        <Form.Group controlId="email" className="mt-2">
          <Row>
            <Col xs={4}>
              <Form.Label>New Email:</Form.Label>
            </Col>
            <Col xs={8}>
              <Form.Control
                className={cx({ "is-invalid": errors?.email })}
                type="email"
                placeholder="Email"
                {...register("email")}
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
            <Button type="submit" disabled={loading}>
              Change Email
            </Button>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default ValidateChangeEmail;
