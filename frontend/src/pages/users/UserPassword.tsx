import { CombinedGraphQLErrors } from "@apollo/client";
import { useNavigate } from "@tanstack/react-router";
import { type FC, useState } from "react";

import { useChangePassword } from "src/graphql";
import { useCurrentUser } from "src/hooks";
import UserPassword, { type UserPasswordData } from "./UserPasswordForm";

const ChangePasswordComponent: FC = () => {
  const { user } = useCurrentUser();
  const [queryError, setQueryError] = useState<string>();
  const navigate = useNavigate();
  const [changePassword] = useChangePassword();

  const doUpdate = (formData: UserPasswordData) => {
    const userData = {
      existing_password: formData.existingPassword,
      new_password: formData.newPassword,
    };
    changePassword({ variables: { userData } })
      .then(() => user && navigate({ to: "/users/$name", params: user }))
      .catch(
        (error) =>
          CombinedGraphQLErrors.is(error) && setQueryError(error.message),
      );
  };

  return (
    <div className="col-6">
      <h3>Change Password</h3>
      <hr />
      <UserPassword error={queryError} callback={doUpdate} />
    </div>
  );
};

export default ChangePasswordComponent;
