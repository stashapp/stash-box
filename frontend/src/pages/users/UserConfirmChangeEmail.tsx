import { FC, useState } from "react";
import { isApolloError } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import { Button, Form } from "react-bootstrap";

import type { User } from "src/AuthContext";
import { useQueryParams, useToast } from "src/hooks";
import { userHref } from "src/utils";
import { ErrorMessage } from "src/components/fragments";
import Title from "src/components/title";
import { useConfirmChangeEmail, UserChangeEmailStatus } from "src/graphql";

const ConfirmChangeEmail: FC<{ user: User }> = ({ user }) => {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | undefined>();
  const [{ token }] = useQueryParams({
    token: { name: "key", type: "string" },
  });
  const toast = useToast();

  const [confirmChangeEmail, { loading }] = useConfirmChangeEmail();

  if (!token) return <ErrorMessage error="Missing key" />;
  if (submitError) return <ErrorMessage error={submitError} />;

  const onSubmit = () => {
    setSubmitError(undefined);
    confirmChangeEmail({ variables: { token } })
      .then((res) => {
        const status = res.data?.confirmChangeEmail;
        if (status === UserChangeEmailStatus.SUCCESS) {
          toast({
            variant: "success",
            content: (
              <>
                <h5>Email successfully changed</h5>
              </>
            ),
          });
          navigate(userHref(user));
        } else if (status === UserChangeEmailStatus.INVALID_TOKEN)
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
          error instanceof Error &&
          isApolloError(error) &&
          setSubmitError(error.message),
      );
    return false;
  };

  return (
    <div className="LoginPrompt">
      <Title page="Confirm Email change" />
      <Form className="align-self-center col-8 mx-auto">
        <h5>Confirm change email</h5>
        <p>Click the button to confirm email change.</p>
        <Button type="submit" disabled={loading} onClick={onSubmit}>
          Complete email change
        </Button>
      </Form>
    </div>
  );
};

export default ConfirmChangeEmail;
