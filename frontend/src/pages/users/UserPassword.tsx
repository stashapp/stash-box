import { type FC, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isApolloError } from "@apollo/client";

import { useChangePassword } from "src/graphql";
import { userHref } from "src/utils";
import UserPassword, { type UserPasswordData } from "./UserPasswordForm";
import { useCurrentUser } from "src/hooks";

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
      .then(() => user && navigate(userHref(user)))
      .catch(
        (error: unknown) =>
          error instanceof Error &&
          isApolloError(error) &&
          setQueryError(error.message),
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
