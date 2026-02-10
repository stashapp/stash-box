import { type FC, useState } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { CombinedGraphQLErrors } from "@apollo/client";
import * as yup from "yup";
import cx from "classnames";
import { Button, Form, Row, Col } from "react-bootstrap";

import type { User } from "src/context";
import { useQueryParams } from "src/hooks";
import { ErrorMessage } from "src/components/fragments";
import Title from "src/components/title";
import { useValidateChangeEmail, UserChangeEmailStatus } from "src/graphql";

const schema = yup.object({
  token: yup.string().required(),
  email: yup.string().required("Email is required"),
});
type ValidateChangeEmailFormData = yup.Asserts<typeof schema>;

const ValidateChangeEmail: FC<{ user: User }> = () => {
  const [submitError, setSubmitError] = useState<string | undefined>();
  const [{ token, submitted }, setQueryParam] = useQueryParams({
    token: { name: "key", type: "string" },
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

  if (submitted)
    return (
      <div className="LoginPrompt">
        <div className="align-self-center col-8 mx-auto">
          <h5>Confirmation email sent</h5>
          <p>Please check your email to complete the email change.</p>
        </div>
      </div>
    );

  if (!token) return <ErrorMessage error="Missing token" />;

  const onSubmit = (formData: ValidateChangeEmailFormData) => {
    setSubmitError(undefined);
    validateChangeEmail({ variables: { ...formData } })
      .then((res) => {
        const status = res.data?.validateChangeEmail;
        if (status === UserChangeEmailStatus.CONFIRM_NEW)
          setQueryParam("submitted", true);
        else if (status === UserChangeEmailStatus.INVALID_TOKEN)
          setSubmitError(
            "Invalid or expired token, please restart the process.",
          );
        else if (status === UserChangeEmailStatus.EXPIRED)
          setSubmitError(
            "Email change token expired, please restart the process.",
          );
        else setSubmitError("An unknown error occurred");
      })
      .catch(
        (error: unknown) =>
          CombinedGraphQLErrors.is(error) && setSubmitError(error.message),
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
        <h5>Change email</h5>
        <p>Enter a new email address to complete email change.</p>
        <Form.Control type="hidden" value={token} {...register("token")} />

        <Form.Group controlId="email" className="mt-2">
          <Form.Control
            className={cx({ "is-invalid": errors?.email })}
            type="email"
            placeholder="New email"
            {...register("email")}
          />
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
