import { FC, useContext, useState } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { isApolloError } from "@apollo/client";
import { useNavigate, useLocation } from "react-router-dom";
import AuthContext, { ContextType } from "src/AuthContext";
import * as yup from "yup";
import cx from "classnames";
import { Button, Form, Row, Col } from "react-bootstrap";

import Title from "src/components/title";
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

const ResetPassword: FC = () => {
  const navigate = useNavigate();
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

  if (Auth.authenticated) navigate(ROUTE_HOME);

  const onSubmit = (formData: ResetPasswordFormData) => {
    const userData = {
      reset_key: formData.resetKey,
      new_password: formData.password,
    };
    setSubmitError(undefined);
    changePassword({ variables: { userData } })
      .then(() => {
        navigate(`${ROUTE_LOGIN}?msg=password-reset`);
      })
      .catch(
        (error: unknown) =>
          error instanceof Error &&
          isApolloError(error) &&
          setSubmitError(error.message)
      );
  };

  const errorList = [
    errors.resetKey?.message,
    errors.email?.message,
    errors.password?.message,
    submitError,
  ].filter((err): err is string => err !== undefined);

  return (
    <div className="LoginPrompt">
      <Title page="Reset Password" />
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
          {...register("resetKey")}
        />

        <Form.Group controlId="password" className="mt-2">
          <Row>
            <Col xs={4}>
              <Form.Label>New Password:</Form.Label>
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
            <Button type="submit" disabled={loading}>
              Set Password
            </Button>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default ResetPassword;
