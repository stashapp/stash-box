import { FC, useContext, useState } from "react";
import { ApolloError } from "@apollo/client";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Button, Form, Row, Col } from "react-bootstrap";
import AuthContext, { ContextType } from "src/AuthContext";
import * as yup from "yup";
import cx from "classnames";

import Title from "src/components/title";
import { useResetPassword } from "src/graphql";
import { ROUTE_HOME } from "src/constants/route";

const schema = yup.object({
  email: yup.string().email().required("Email is required"),
});
type ResetPasswordFormData = yup.Asserts<typeof schema>;

const ForgotPassword: FC = () => {
  const navigate = useNavigate();
  const [resetEmail, setResetEmail] = useState("");
  const Auth = useContext<ContextType>(AuthContext);
  const [submitError, setSubmitError] = useState<string | undefined>();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: yupResolver(schema),
  });

  const [resetPassword, { loading }] = useResetPassword();

  if (Auth.authenticated) navigate(ROUTE_HOME);

  const onSubmit = (formData: ResetPasswordFormData) => {
    const userData = {
      email: formData.email,
    };
    setSubmitError(undefined);
    resetPassword({ variables: { input: userData } })
      .then(() => {
        setResetEmail(formData.email);
      })
      .catch((err?: ApolloError) => {
        if (err?.message) {
          setSubmitError(err.message);
        }
      });
  };

  if (resetEmail)
    return (
      <div className="LoginPrompt">
        <div className="align-self-center col-8 mx-auto">
          <h5>Pasword reset</h5>
          <p>
            If a matching account was found an email was sent to {resetEmail} to
            allow you to reset your password.
          </p>
          <a href="/login">Return to login</a>
        </div>
      </div>
    );

  const errorList = [errors.email?.message, submitError].filter(
    (err): err is string => err !== undefined
  );

  return (
    <div className="LoginPrompt mx-auto d-flex">
      <Title page="Forgot Password" />
      <Form
        className="align-self-center col-8 mx-auto"
        onSubmit={handleSubmit(onSubmit)}
      >
        <Form.Group controlId="email">
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

        <Row>
          <Col
            xs={{ span: 3, offset: 9 }}
            className="justify-content-end mt-2 d-flex"
          >
            <Button type="submit" disabled={loading}>
              Reset Password
            </Button>
          </Col>
        </Row>

        {errorList.map((error) => (
          <Row key={error} className="text-end text-danger">
            <div>{error}</div>
          </Row>
        ))}
      </Form>
    </div>
  );
};

export default ForgotPassword;
