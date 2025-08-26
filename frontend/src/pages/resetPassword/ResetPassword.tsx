import { type FC, useState } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { isApolloError } from "@apollo/client";
import { useNavigate, useLocation } from "react-router-dom";
import * as yup from "yup";
import cx from "classnames";
import { Button, Form, Row, Col } from "react-bootstrap";

import { ErrorMessage } from "src/components/fragments";
import Title from "src/components/title";
import { useChangePassword } from "src/graphql";
import { useCurrentUser } from "src/hooks";
import { ROUTE_HOME, ROUTE_LOGIN } from "src/constants/route";

const schema = yup.object({
  resetKey: yup.string().required("Reset Key is required"),
  newPassword: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .test(
      "uniqueness",
      "Password must have at least 5 unique characters",
      (value) =>
        value !== undefined &&
        value
          .split("")
          .filter(
            (item: string, i: number, ar: string[]) => ar.indexOf(item) === i,
          )
          .join("").length >= 5,
    )
    .required("Password is required"),
  confirmNewPassword: yup
    .string()
    .nullable()
    .oneOf([yup.ref("newPassword"), null], "Passwords don't match")
    .required("Password is required"),
});
type ResetPasswordFormData = yup.Asserts<typeof schema>;

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const ResetPassword: FC = () => {
  const navigate = useNavigate();
  const query = useQuery();
  const [submitError, setSubmitError] = useState<string | undefined>();
  const { isAuthenticated } = useCurrentUser();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: yupResolver(schema),
  });

  const [changePassword, { loading }] = useChangePassword();

  if (isAuthenticated) navigate(ROUTE_HOME);

  const key = query.get("key");

  if (!key) return <ErrorMessage error="Invalid request" />;

  const onSubmit = (formData: ResetPasswordFormData) => {
    const userData = {
      reset_key: formData.resetKey,
      new_password: formData.newPassword,
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
          setSubmitError(error.message),
      );
  };

  const errorList = [
    errors.resetKey?.message,
    errors.newPassword?.message,
    errors.confirmNewPassword?.message,
    submitError,
  ].filter((err): err is string => err !== undefined);

  return (
    <div className="LoginPrompt">
      <Title page="Reset Password" />
      <Form
        className="align-self-center col-8 mx-auto"
        onSubmit={handleSubmit(onSubmit)}
      >
        <Form.Control type="hidden" value={key} {...register("resetKey")} />

        <Form.Group controlId="password" className="mt-2">
          <h3>Reset Password</h3>
          <hr className="my-4" />
          <Row>
            <Col>
              <Form.Group controlId="newPassword" className="mb-3">
                <Form.Control
                  className={cx({ "is-invalid": errors.newPassword })}
                  type="password"
                  placeholder="New Password"
                  {...register("newPassword")}
                />
                <div className="invalid-feedback">
                  {errors?.newPassword?.message}
                </div>
              </Form.Group>
              <Form.Group controlId="confirmNewPassword" className="mb-3">
                <Form.Control
                  className={cx({ "is-invalid": errors.confirmNewPassword })}
                  type="password"
                  placeholder="Confirm New Password"
                  {...register("confirmNewPassword")}
                />
                <div className="invalid-feedback">
                  {errors?.confirmNewPassword?.message}
                </div>
              </Form.Group>
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
